package com.scammers.productservice.services;

import com.scammers.productservice.configs.SecurityUtils;
import com.scammers.productservice.models.Product;
import com.scammers.productservice.models.requests.ProductCreateRequest;
import com.scammers.productservice.repositories.ProductRepository;
import jakarta.ws.rs.NotFoundException;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.security.access.AccessDeniedException;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ProductServiceTest {

    @Mock
    private ProductRepository productRepository;

    @InjectMocks
    private ProductService productService;

    private final UUID sellerId = UUID.randomUUID();
    private final UUID productUuid = UUID.randomUUID();
    private final UUID currentUserId = UUID.randomUUID();

    private MockedStatic<SecurityUtils> securityUtilsMock;

    @BeforeEach
    void setUp() {
        securityUtilsMock = Mockito.mockStatic(SecurityUtils.class);
        securityUtilsMock.when(SecurityUtils::getCurrentUserUUID).thenReturn(currentUserId);
        securityUtilsMock.when(() -> SecurityUtils.hasRole("SELLER")).thenReturn(false);
    }

    @AfterEach
    void tearDown() {
        securityUtilsMock.close();
    }

    @Test
    void findByUUID_ShouldReturnProduct() {
        Product product = Product.builder()
                .productUUID(productUuid)
                .sellerId(sellerId)
                .title("Test Product")
                .price(99.99)
                .stock(10L)
                .build();

        when(productRepository.findByUUID(productUuid)).thenReturn(product);

        Optional<Product> result = productService.findByUUID(productUuid);

        assertThat(result).isPresent();
        assertThat(result.get().getProductUUID()).isEqualTo(productUuid);
        verify(productRepository).findByUUID(productUuid);
    }

    @Test
    void findByUUID_ShouldReturnEmptyForNonExistentProduct() {
        when(productRepository.findByUUID(productUuid)).thenReturn(null);

        Optional<Product> result = productService.findByUUID(productUuid);

        assertThat(result).isEmpty();
        verify(productRepository).findByUUID(productUuid);
    }

    /*@Test
    void addProduct_ShouldCreateProduct() {
        securityUtilsMock.when(SecurityUtils::getCurrentUserUUID).thenReturn(sellerId);

        ProductCreateRequest request = new ProductCreateRequest(
                "Test Product", "Test Description", 99.99, 10L
        );

        Product savedProduct = Product.builder()
                .productUUID(UUID.randomUUID())
                .sellerId(sellerId)
                .title("Test Product")
                .description("Test Description")
                .price(99.99)
                .stock(10L)
                .build();

        when(productRepository.save(any(Product.class))).thenReturn(savedProduct);

        Optional<Product> result = productService.addProduct(request);

        assertThat(result).isPresent();
        assertThat(result.get().getTitle()).isEqualTo("Test Product");
        verify(productRepository).save(any(Product.class));
    }*/

    @Test
    void addProduct_ShouldThrowExceptionWhenPriceIsNegative() {
        ProductCreateRequest request = new ProductCreateRequest(
                "Test Product", "Test Description", -10.0, 5L
        );

        assertThatThrownBy(() -> productService.addProduct(request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Цена не может быть меньше 0");

        verify(productRepository, never()).save(any());
    }

    @Test
    void addProduct_ShouldThrowExceptionWhenTitleIsEmpty() {
        ProductCreateRequest request = new ProductCreateRequest(
                "", "Test Description", 99.99, 5L
        );

        assertThatThrownBy(() -> productService.addProduct(request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Название товара и его описание должны быть заполнены");

        verify(productRepository, never()).save(any());
    }

    /*@Test
    void addProduct_ShouldThrowExceptionWhenStockIsZero() {
        ProductCreateRequest request = new ProductCreateRequest(
                "Test Product", "Test Description", 99.99, 0L
        );

        assertThatThrownBy(() -> productService.addProduct(request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("В наличии должен быть хотя бы один товар");

        verify(productRepository, never()).save(any());
    }*/

    @Test
    void updateProduct_ShouldUpdateProductWhenUserIsOwner() {
        Product existingProduct = Product.builder()
                .productUUID(productUuid)
                .sellerId(sellerId)
                .title("Old Title")
                .description("Old Description")
                .price(50.0)
                .stock(5L)
                .build();

        ProductCreateRequest updateRequest = new ProductCreateRequest(
                "New Title", "New Description", 75.0, 8L
        );

        Product updatedProduct = Product.builder()
                .productUUID(productUuid)
                .sellerId(sellerId)
                .title("New Title")
                .description("New Description")
                .price(75.0)
                .stock(8L)
                .build();

        when(productRepository.findByUUID(productUuid)).thenReturn(existingProduct);
        when(productRepository.update(any(Product.class))).thenReturn(updatedProduct);
        securityUtilsMock.when(SecurityUtils::getCurrentUserUUID).thenReturn(sellerId);

        Optional<Product> result = productService.updateProduct(productUuid, updateRequest);

        assertThat(result).isPresent();
        assertThat(result.get().getTitle()).isEqualTo("New Title");
        assertThat(result.get().getPrice()).isEqualTo(75.0);
        verify(productRepository).update(any(Product.class));
    }

    @Test
    void updateProduct_ShouldThrowNotFoundExceptionWhenProductNotFound() {
        ProductCreateRequest request = new ProductCreateRequest(
                "New Title", "New Description", 75.0, 8L
        );

        when(productRepository.findByUUID(productUuid)).thenReturn(null);

        assertThatThrownBy(() -> productService.updateProduct(productUuid, request))
                .isInstanceOf(NotFoundException.class)
                .hasMessage("Product not found");

        verify(productRepository, never()).update(any());
    }

    /*@Test
    void updateProduct_ShouldThrowAccessDeniedWhenUserIsNotOwner() {
        Product existingProduct = Product.builder()
                .productUUID(productUuid)
                .sellerId(sellerId)
                .title("Old Title")
                .price(50.0)
                .stock(5L)
                .build();

        ProductCreateRequest updateRequest = new ProductCreateRequest(
                "New Title", "New Description", 75.0, 8L
        );

        when(productRepository.findByUUID(productUuid)).thenReturn(existingProduct);

        assertThatThrownBy(() -> productService.updateProduct(productUuid, updateRequest))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessage("Not owner");

        verify(productRepository, never()).update(any());
    }*/

    @Test
    void updateProduct_ShouldAllowAdminToUpdateAnyProduct() {
        UUID adminUserId = UUID.randomUUID();
        securityUtilsMock.when(SecurityUtils::getCurrentUserUUID).thenReturn(adminUserId);
        securityUtilsMock.when(() -> SecurityUtils.hasRole("SELLER")).thenReturn(true);

        Product existingProduct = Product.builder()
                .productUUID(productUuid)
                .sellerId(sellerId)
                .title("Old Title")
                .price(50.0)
                .stock(5L)
                .build();

        ProductCreateRequest updateRequest = new ProductCreateRequest(
                "New Title", "New Description", 75.0, 8L
        );

        Product updatedProduct = Product.builder()
                .productUUID(productUuid)
                .sellerId(sellerId)
                .title("New Title")
                .description("New Description")
                .price(75.0)
                .stock(8L)
                .build();

        when(productRepository.findByUUID(productUuid)).thenReturn(existingProduct);
        when(productRepository.update(any(Product.class))).thenReturn(updatedProduct);

        Optional<Product> result = productService.updateProduct(productUuid, updateRequest);

        assertThat(result).isPresent();
        verify(productRepository).update(any(Product.class));
    }

    @Test
    void findPaginated_ShouldReturnPaginatedResults() {
        List<Product> products = List.of(
                Product.builder().productUUID(UUID.randomUUID()).title("Product 1").price(10.0).stock(5L).build(),
                Product.builder().productUUID(UUID.randomUUID()).title("Product 2").price(20.0).stock(10L).build()
        );

        when(productRepository.findByOffsetSize(0, 20, "id")).thenReturn(products);
        when(productRepository.getTotalCountOfProducts()).thenReturn(2L);

        Page<Product> result = productService.findPaginated(0, 20, "id");

        assertThat(result.getContent()).hasSize(2);
        assertThat(result.getTotalElements()).isEqualTo(2);
        assertThat(result.getTotalPages()).isEqualTo(1);
        verify(productRepository).findByOffsetSize(0, 20, "id");
        verify(productRepository).getTotalCountOfProducts();
    }

    @Test
    void findPaginated_ShouldHandleInvalidPageAndSize() {
        List<Product> products = List.of(
                Product.builder().productUUID(UUID.randomUUID()).title("Product 1").price(10.0).stock(5L).build()
        );

        when(productRepository.findByOffsetSize(0, 20, "id")).thenReturn(products);
        when(productRepository.getTotalCountOfProducts()).thenReturn(1L);

        Page<Product> result = productService.findPaginated(-1, 0, "id");

        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getNumber()).isZero();
        assertThat(result.getSize()).isEqualTo(20);
    }

    @Test
    void findPaginated_ShouldLimitMaxSize() {
        List<Product> products = List.of(
                Product.builder().productUUID(UUID.randomUUID()).title("Product 1").price(10.0).stock(5L).build()
        );

        when(productRepository.findByOffsetSize(0, 100, "id")).thenReturn(products);
        when(productRepository.getTotalCountOfProducts()).thenReturn(1L);

        Page<Product> result = productService.findPaginated(0, 150, "id");

        assertThat(result.getSize()).isEqualTo(100);
    }

    @Test
    void isOwner_ShouldReturnTrueWhenUserIsOwner() {
        when(productRepository.getSellerUUID(productUuid)).thenReturn(currentUserId);

        boolean result = productService.isOwner(productUuid);

        assertThat(result).isTrue();
        verify(productRepository).getSellerUUID(productUuid);
    }

    @Test
    void isOwner_ShouldReturnFalseWhenUserIsNotOwner() {
        when(productRepository.getSellerUUID(productUuid)).thenReturn(sellerId);

        boolean result = productService.isOwner(productUuid);

        assertThat(result).isFalse();
        verify(productRepository).getSellerUUID(productUuid);
    }

    @Test
    void isOwner_ShouldThrowExceptionWhenUserNotAuthenticated() {
        securityUtilsMock.when(SecurityUtils::getCurrentUserUUID).thenThrow(new IllegalStateException("No authenticated user"));

        assertThatThrownBy(() -> productService.isOwner(productUuid))
                .isInstanceOf(IllegalStateException.class)
                .hasMessage("No authenticated user");
    }
}