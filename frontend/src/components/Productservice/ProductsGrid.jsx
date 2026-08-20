import React, { useState, useEffect } from 'react';
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
                          stockById,
                          onOpenStock,
                      }) => {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => {
                const pid = product.productUUID || product.id;
                const stockInfo = stockById?.[pid];
                return (
                    <ProductCard
                        key={pid}
                        product={product}
                        canManage={canManage}
                        onEdit={onEdit}
                        showBuy={showBuy}
                        showUpload={showUpload}
                        onUpload={onUpload}
                        onRequireAuth={onRequireAuth}
                        onSetMainAttachment={onSetMainAttachment}
                        onDeleteAttachment={onDeleteAttachment}
                        stockInfo={stockInfo}
                        onOpenStock={onOpenStock}
                    />
                );
            })}
        </div>
    );
};

export default ProductsGrid;