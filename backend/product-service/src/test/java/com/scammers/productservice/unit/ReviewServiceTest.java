package com.scammers.productservice.unit;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.ws.rs.NotFoundException;
import com.scammers.productservice.models.Review;
import com.scammers.productservice.models.dtos.ShowReview;
import com.scammers.productservice.models.enums.EventType;
import com.scammers.productservice.models.enums.ReviewStatus;
import com.scammers.productservice.models.requests.ReviewCreateRequest;
import com.scammers.productservice.repositories.OutboxRepository;
import com.scammers.productservice.repositories.ProductRepository;
import com.scammers.productservice.repositories.ReviewRepository;
import com.scammers.productservice.services.ReviewService;
import io.qameta.allure.Epic;
import io.qameta.allure.Feature;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.security.access.AccessDeniedException;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@Epic("Review Management")
@Feature("Creating and deleting reviews")
@DisplayName("Unit tests for ReviewService")
public class ReviewServiceTest {
    @Mock
    private ReviewRepository mockRepository;
    @Mock
    private OutboxRepository mockOutboxRepo;
    @Mock
    private ProductRepository mockProductRepository;
    @Mock
    private ObjectMapper mockObjectMapper;

    private ReviewService reviewService;

    @BeforeEach
    public void setUp() {
        MockitoAnnotations.openMocks(this);
        reviewService = new ReviewService(mockRepository, mockOutboxRepo,
                mockProductRepository, mockObjectMapper);
    }

    private ReviewCreateRequest request(short mark, String text) {
        return new ReviewCreateRequest(mark, text);
    }

    @Test
    @DisplayName("Creating a new review should save it and publish outbox CREATED event")
    public void testSaveReview_NewReview_ShouldSaveAndPublishCreated() throws Exception {
        UUID productUUID = UUID.randomUUID();
        UUID userUUID = UUID.randomUUID();
        Review saved = new Review();
        saved.setId(1L);
        when(mockProductRepository.getSellerUUID(productUUID)).thenReturn(UUID.randomUUID());
        when(mockRepository.findReviewByProductAndUser(productUUID, userUUID))
                .thenReturn(Optional.empty());
        when(mockRepository.save(any(Review.class))).thenReturn(saved);
        when(mockObjectMapper.writeValueAsString(any())).thenReturn("{}");

        Review result = reviewService.saveReviewOnProduct(productUUID, userUUID, request((short) 5, "Great"));

        assertEquals(saved, result);
        verify(mockRepository, times(1)).save(any(Review.class));
        verify(mockOutboxRepo, times(1)).save(argThat(event ->
                EventType.CREATED.name().equals(event.getType())));
    }

    @Test
    @DisplayName("Updating an existing review should publish outbox UPDATED event")
    public void testSaveReview_UpdateExisting_ShouldPublishUpdated() throws Exception {
        UUID productUUID = UUID.randomUUID();
        UUID userUUID = UUID.randomUUID();
        Review existing = new Review();
        existing.setId(1L);
        existing.setUserUUID(userUUID);
        existing.setProductUUID(productUUID);
        existing.setRating((short) 3);
        existing.setComment("Old");
        existing.setReviewStatus(ReviewStatus.PUBLISHED);

        when(mockProductRepository.getSellerUUID(productUUID)).thenReturn(UUID.randomUUID());
        when(mockRepository.findReviewByProductAndUser(productUUID, userUUID))
                .thenReturn(Optional.of(existing));
        when(mockRepository.save(any(Review.class))).thenReturn(existing);
        when(mockObjectMapper.writeValueAsString(any())).thenReturn("{}");

        Review result = reviewService.saveReviewOnProduct(productUUID, userUUID, request((short) 4, "Updated"));

        assertEquals((short) 4, result.getRating());
        assertEquals(ReviewStatus.PENDING_PUB, result.getReviewStatus());
        verify(mockOutboxRepo, times(1)).save(argThat(event ->
                EventType.UPDATED.name().equals(event.getType())));
    }

    @Test
    @DisplayName("Saving review with identical data should return without saving or event")
    public void testSaveReview_NoChanges_ShouldDoNothing() throws Exception {
        UUID productUUID = UUID.randomUUID();
        UUID userUUID = UUID.randomUUID();
        Review existing = new Review();
        existing.setId(1L);
        existing.setUserUUID(userUUID);
        existing.setRating((short) 4);
        existing.setComment("Same");
        existing.setReviewStatus(ReviewStatus.PUBLISHED);

        when(mockProductRepository.getSellerUUID(productUUID)).thenReturn(UUID.randomUUID());
        when(mockRepository.findReviewByProductAndUser(productUUID, userUUID))
                .thenReturn(Optional.of(existing));

        Review result = reviewService.saveReviewOnProduct(productUUID, userUUID, request((short) 4, "Same"));

        assertEquals(existing, result);
        verify(mockRepository, never()).save(any());
        verify(mockOutboxRepo, never()).save(any());
    }

    @Test
    @DisplayName("Review with invalid rating should throw IllegalArgumentException")
    public void testSaveReview_InvalidRating_ShouldThrow() {
        UUID productUUID = UUID.randomUUID();
        UUID userUUID = UUID.randomUUID();
        when(mockProductRepository.getSellerUUID(productUUID)).thenReturn(UUID.randomUUID());

        assertThrows(IllegalArgumentException.class,
                () -> reviewService.saveReviewOnProduct(productUUID, userUUID, request((short) 6, "text")));
        verify(mockRepository, never()).save(any());
    }

    @Test
    @DisplayName("User cannot review own product — should throw AccessDeniedException")
    public void testSaveReview_OwnProduct_ShouldThrowAccessDenied() {
        UUID productUUID = UUID.randomUUID();
        UUID userUUID = UUID.randomUUID();
        when(mockProductRepository.getSellerUUID(productUUID)).thenReturn(userUUID);

        assertThrows(AccessDeniedException.class,
                () -> reviewService.saveReviewOnProduct(productUUID, userUUID, request((short) 5, "text")));
    }

    @Test
    @DisplayName("Owner can initiate delete — status becomes PENDING_DEL and event published")
    public void testInitiateDelete_AsOwner_ShouldSetPendingDelAndPublish() throws Exception {
        UUID productUUID = UUID.randomUUID();
        UUID userUUID = UUID.randomUUID();
        Review review = new Review();
        review.setId(1L);
        review.setUserUUID(userUUID);
        review.setProductUUID(productUUID);
        review.setRating((short) 5);
        review.setReviewStatus(ReviewStatus.PUBLISHED);

        when(mockRepository.findReviewByProductAndUser(productUUID, userUUID))
                .thenReturn(Optional.of(review));
        when(mockRepository.save(any(Review.class))).thenReturn(review);
        when(mockObjectMapper.writeValueAsString(any())).thenReturn("{}");

        reviewService.initiateDeleteReview(productUUID, userUUID, false);

        assertEquals(ReviewStatus.PENDING_DEL, review.getReviewStatus());
        verify(mockRepository, times(1)).save(review);
        verify(mockOutboxRepo, times(1)).save(argThat(event ->
                EventType.DELETED.name().equals(event.getType())));
    }

    @Test
    @DisplayName("Non-owner non-admin cannot delete review")
    public void testInitiateDelete_NonOwnerNonAdmin_ShouldThrowAccessDenied() {
        UUID productUUID = UUID.randomUUID();
        UUID requesterUUID = UUID.randomUUID();

        Review review = new Review();
        review.setUserUUID(UUID.randomUUID());
        review.setReviewStatus(ReviewStatus.PUBLISHED);

        when(mockRepository.findReviewByProductAndUser(productUUID, requesterUUID))
                .thenReturn(Optional.of(review));

        assertThrows(AccessDeniedException.class,
                () -> reviewService.initiateDeleteReview(productUUID, requesterUUID, false));
    }


    @Test
    @DisplayName("Deleting an already deleted review should do nothing")
    public void testInitiateDelete_AlreadyDeleted_ShouldDoNothing() {
        UUID productUUID = UUID.randomUUID();
        UUID userUUID = UUID.randomUUID();
        Review review = new Review();
        review.setUserUUID(userUUID);
        review.setReviewStatus(ReviewStatus.DELETED);

        when(mockRepository.findReviewByProductAndUser(productUUID, userUUID))
                .thenReturn(Optional.of(review));

        reviewService.initiateDeleteReview(productUUID, userUUID, false);

        verify(mockRepository, never()).save(any());
        verify(mockOutboxRepo, never()).save(any());
    }

    @Test
    @DisplayName("Deleting missing review should throw NotFoundException")
    public void testInitiateDelete_MissingReview_ShouldThrowNotFound() {
        UUID productUUID = UUID.randomUUID();
        UUID userUUID = UUID.randomUUID();
        when(mockRepository.findReviewByProductAndUser(productUUID, userUUID))
                .thenReturn(Optional.empty());

        assertThrows(NotFoundException.class,
                () -> reviewService.initiateDeleteReview(productUUID, userUUID, false));
    }

    @Test
    @DisplayName("getReviewsForProduct should delegate to repository")
    public void testGetReviewsForProduct_ShouldReturnList() {
        UUID productUUID = UUID.randomUUID();
        List<ShowReview> reviews = List.of(
                new ShowReview(UUID.randomUUID(),
                        "Good product",
                        (short) 5,
                        Instant.now()
                )
        );
        when(mockRepository.findReviewsForProduct(productUUID, 10, 0)).thenReturn(reviews);

        List<ShowReview> result = reviewService.getReviewsForProduct(productUUID, 10, 0);

        assertEquals(reviews, result);
    }
}