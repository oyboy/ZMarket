package com.scammers.productservice.unit;

import jakarta.ws.rs.NotFoundException;
import com.scammers.productservice.configs.SecurityUtils;
import com.scammers.productservice.controllers.WarehouseClient;
import com.scammers.productservice.models.Product;
import com.scammers.productservice.models.requests.ProductCreateRequest;
import com.scammers.productservice.models.requests.StockOperationRequest;
import com.scammers.productservice.repositories.CategoryRepository;
import com.scammers.productservice.repositories.ProductRepository;
import com.scammers.productservice.services.ProductService;
import com.scammers.productservice.services.UserClient;
import io.qameta.allure.Epic;
import io.qameta.allure.Feature;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.Mockito;
import org.mockito.MockitoAnnotations;
import org.springframework.data.domain.Page;

import java.util.HashMap;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@Epic("Product Management")
@Feature("Product CRUD and pagination")
@DisplayName("Unit tests for ProductService")
public class ProductServiceTest {

    @Mock
    private ProductRepository mockProductRepository;
    @Mock
    private UserClient mockUserClient;
    @Mock
    private WarehouseClient mockWarehouseClient;
    @Mock
    private CategoryRepository mockCategoryRepository;

    private ProductService productService;

    private final UUID currentUserId = UUID.randomUUID();
    private MockedStatic<SecurityUtils> mockedSecurityUtils;

    @BeforeEach
    public void setUp() {
        MockitoAnnotations.openMocks(this);
        productService = new ProductService(mockProductRepository, mockUserClient,
                mockWarehouseClient, mockCategoryRepository);
        mockedSecurityUtils = Mockito.mockStatic(SecurityUtils.class);
        mockedSecurityUtils.when(SecurityUtils::getCurrentUserUUID).thenReturn(currentUserId);
    }

    @AfterEach
    public void tearDown() {
        mockedSecurityUtils.close();
    }

    private ProductCreateRequest validRequest() {
        return new ProductCreateRequest(
                "Title",
                "Description",
                100.0,
                10L,
                1L,
                new HashMap<>()
        );
    }

    @Test
    @DisplayName("findByUUID should return product when it exists")
    public void testFindByUUID_ShouldReturnProduct() {
        Product product = new Product();
        when(mockProductRepository.findByUUID(product.getProductUUID())).thenReturn(product);

        Optional<Product> result = productService.findByUUID(product.getProductUUID());

        assertTrue(result.isPresent());
        assertEquals(product, result.get());
    }

    @Test
    @DisplayName("findByUUID should return empty Optional when product not found")
    public void testFindByUUID_WhenNotFound_ShouldReturnEmpty() {
        UUID uuid = UUID.randomUUID();
        when(mockProductRepository.findByUUID(uuid)).thenReturn(null);

        Optional<Product> result = productService.findByUUID(uuid);

        assertTrue(result.isEmpty());
    }

    @Test
    @DisplayName("getProductsForSeller should return list of products")
    public void testGetProductsForSeller_ShouldReturnList() {
        UUID sellerId = UUID.randomUUID();
        List<Product> products = List.of(new Product(), new Product());
        when(mockProductRepository.getProductsForSellerByUUID(sellerId)).thenReturn(products);

        Optional<List<Product>> result = productService.getProductsForSeller(sellerId);

        assertTrue(result.isPresent());
        assertEquals(2, result.get().size());
    }

    @Test
    @DisplayName("addProduct should save product and add stock to warehouse")
    public void testAddProduct_ShouldSaveProductAndAddStock() {
        ProductCreateRequest request = validRequest();
        when(mockCategoryRepository.existsById(request.categoryId())).thenReturn(true);
        when(mockProductRepository.save(any(Product.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        Optional<Product> result = productService.addProduct(request);

        assertTrue(result.isPresent());
        assertEquals(request.title(), result.get().getTitle());
        assertEquals(request.price(), result.get().getPrice());
        assertEquals(currentUserId, result.get().getSellerId());
        assertEquals(request.categoryId(), result.get().getCategoryId());
        verify(mockWarehouseClient, times(1)).addStock(any(StockOperationRequest.class));
        verify(mockProductRepository, times(1)).save(any(Product.class));
    }

    @Test
    @DisplayName("addProduct with zero stock should not call warehouse")
    public void testAddProduct_WithZeroStock_ShouldNotCallWarehouse() {
        ProductCreateRequest request = new ProductCreateRequest(
                "Title",
                "Description",
                100.0,
                0L,
                1L,
                new HashMap<>()
        );
        when(mockCategoryRepository.existsById(request.categoryId())).thenReturn(true);
        when(mockProductRepository.save(any(Product.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        productService.addProduct(request);

        verify(mockWarehouseClient, never()).addStock(any(StockOperationRequest.class));
    }

    @Test
    @DisplayName("addProduct with negative price should throw IllegalArgumentException")
    public void testAddProduct_WithNegativePrice_ShouldThrow() {
        ProductCreateRequest request = new ProductCreateRequest(
                "Title",
                "Description",
                -1.0,
                10L,
                1L,
                new HashMap<>()
        );

        assertThrows(IllegalArgumentException.class, () -> productService.addProduct(request));
        verify(mockProductRepository, never()).save(any(Product.class));
    }

    @Test
    @DisplayName("addProduct with empty title should throw IllegalArgumentException")
    public void testAddProduct_WithEmptyTitle_ShouldThrow() {
        ProductCreateRequest request = new ProductCreateRequest(
                "",
                "Description",
                100.0,
                10L,
                1L,
                new HashMap<>()
        );

        assertThrows(IllegalArgumentException.class, () -> productService.addProduct(request));
    }

    @Test
    @DisplayName("addProduct with non-existent category should throw RuntimeException")
    public void testAddProduct_WithMissingCategory_ShouldThrow() {
        ProductCreateRequest request = validRequest();
        when(mockCategoryRepository.existsById(request.categoryId())).thenReturn(false);

        assertThrows(RuntimeException.class, () -> productService.addProduct(request));
        verify(mockProductRepository, never()).save(any(Product.class));
    }

    @Test
    @DisplayName("findPaginated should normalize page and size and return page")
    public void testFindPaginated_ShouldReturnPage() {
        List<Product> products = List.of(new Product(), new Product());
        when(mockProductRepository.findByOffsetSize(0, 20, "title", 1L)).thenReturn(products);
        when(mockProductRepository.getTotalCountOfProducts(1L)).thenReturn(2L);

        Page<Product> page = productService.findPaginated(-1, 0, "title", 1L);

        assertEquals(2, page.getContent().size());
        assertEquals(2, page.getTotalElements());
        assertEquals(20, page.getSize());
        verify(mockProductRepository, times(1)).findByOffsetSize(0, 20, "title", 1L);
    }

    @Test
    @DisplayName("findPaginated should cap size at 100")
    public void testFindPaginated_WithBigSize_ShouldCapSize() {
        when(mockProductRepository.findByOffsetSize(anyInt(), eq(100), anyString(), any()))
                .thenReturn(List.of());
        when(mockProductRepository.getTotalCountOfProducts(any())).thenReturn(0L);

        Page<Product> page = productService.findPaginated(0, 500, "title", null);

        assertEquals(100, page.getSize());
    }

    @Test
    @DisplayName("updateProduct should update fields and return updated product")
    public void testUpdateProduct_ShouldUpdateFields() {
        Product existing = new Product();
        UUID productUUID = existing.getProductUUID();
        when(mockProductRepository.findByUUID(productUUID)).thenReturn(existing);
        when(mockProductRepository.update(existing)).thenReturn(existing);

        ProductCreateRequest request = new ProductCreateRequest("New Title", "New Desc",
                50.0, null, null, null);

        Optional<Product> result = productService.updateProduct(productUUID, request);

        assertTrue(result.isPresent());
        assertEquals("New Title", result.get().getTitle());
        assertEquals("New Desc", result.get().getDescription());
        assertEquals(50.0, result.get().getPrice());
        verify(mockProductRepository, times(1)).update(existing);
    }

    @Test
    @DisplayName("updateProduct for missing product should throw NotFoundException")
    public void testUpdateProduct_WhenNotFound_ShouldThrow() {
        UUID uuid = UUID.randomUUID();
        when(mockProductRepository.findByUUID(uuid)).thenReturn(null);

        assertThrows(NotFoundException.class, () -> productService.updateProduct(uuid, validRequest()));
    }

    @Test
    @DisplayName("updateProduct with non-existent category should throw RuntimeException")
    public void testUpdateProduct_WithMissingCategory_ShouldThrow() {
        Product existing = new Product();
        when(mockProductRepository.findByUUID(existing.getProductUUID())).thenReturn(existing);
        when(mockCategoryRepository.existsById(any())).thenReturn(false);

        ProductCreateRequest request = new ProductCreateRequest(
                "Title",
                "Desc",
                10.0,
                null,
                999L,
                null
        );

        assertThrows(RuntimeException.class,
                () -> productService.updateProduct(existing.getProductUUID(), request));
    }

    @Test
    @DisplayName("isOwner should return true for current owner")
    public void testIsOwner_ShouldReturnTrueForOwner() {
        UUID productUuid = UUID.randomUUID();
        when(mockProductRepository.getSellerUUID(productUuid)).thenReturn(currentUserId);

        assertTrue(productService.isOwner(productUuid));
    }

    @Test
    @DisplayName("isOwner should return false for another user's product")
    public void testIsOwner_ShouldReturnFalseForOtherUser() {
        UUID productUuid = UUID.randomUUID();
        when(mockProductRepository.getSellerUUID(productUuid)).thenReturn(UUID.randomUUID());

        assertFalse(productService.isOwner(productUuid));
    }

    @Test
    @DisplayName("updateStockFromKafka should delegate to repository")
    public void testUpdateStockFromKafka_ShouldUpdateRepository() {
        UUID productId = UUID.randomUUID();
        productService.updateStockFromKafka(productId, 42L);

        verify(mockProductRepository, times(1)).updateStock(productId, 42L);
    }
}
