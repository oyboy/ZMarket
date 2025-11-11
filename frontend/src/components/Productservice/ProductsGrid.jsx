import React from 'react';
import ProductCard from './ProductCard';

const ProductsGrid = ({
                          products,
                          canManage,
                          onEdit,
                          showBuy = true,
                          showUpload = false,
                          onUpload,
                          onRequireAuth,
                          onSetMainAttachment,
                          onDeleteAttachment,
                      }) => {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
                <ProductCard
                    key={product.productUUID || product.id}
                    product={product}
                    canManage={canManage}
                    onEdit={onEdit}
                    showBuy={showBuy}
                    showUpload={showUpload}
                    onUpload={onUpload}
                    onRequireAuth={onRequireAuth}
                    onSetMainAttachment={onSetMainAttachment}
                    onDeleteAttachment={onDeleteAttachment}
                />
            ))}
        </div>
    );
};

export default ProductsGrid;