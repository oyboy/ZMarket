package com.scammers.productservice.services;

import com.scammers.productservice.models.Category;
import com.scammers.productservice.models.CategoryNode;
import com.scammers.productservice.models.requests.CategoryRequest;
import com.scammers.productservice.repositories.CategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class CategoryService {
    private final CategoryRepository categoryRepository;

    public List<Category> getAllCategories() {
        return categoryRepository.findAll();
    }

    public List<CategoryNode> getCategoryTree() {
        List<Category> allCategories = categoryRepository.findAll();

        Map<Long, CategoryNode> nodesMap = new HashMap<>();

        for (Category cat : allCategories) {
            nodesMap.put(cat.getId(), new CategoryNode(cat));
        }

        List<CategoryNode> rootNodes = new ArrayList<>();

        for (Category cat : allCategories) {
            CategoryNode node = nodesMap.get(cat.getId());

            if (cat.getParentId() == null) {
                rootNodes.add(node);
            } else {
                CategoryNode parent = nodesMap.get(cat.getParentId());
                if (parent != null) {
                    parent.getChildren().add(node);
                } else {
                    rootNodes.add(node);
                }
            }
        }
        return rootNodes;
    }

    @Transactional
    public Category createCategory(CategoryRequest request) {
        if (request.parentId() != null && !categoryRepository.existsById(request.parentId())) {
            throw new RuntimeException("Родительская категория не найдена");
        }

        String slug = request.slug();
        if (slug == null || slug.isBlank()) {
            slug = generateSlug(request.name());
        }

        Category category = new Category(null, request.name(), request.parentId(), slug);
        Long id = categoryRepository.save(category);
        category.setId(id);

        return category;
    }

    @Transactional
    public Category updateCategory(Long id, CategoryRequest request) {
        Category existing = categoryRepository.findById(id);
        if (existing == null) throw new RuntimeException("Категория не найдена");

        if (id.equals(request.parentId())) {
            throw new RuntimeException("Категория не может быть родителем самой себя");
        }

        existing.setName(request.name());
        existing.setParentId(request.parentId());

        if (request.slug() != null && !request.slug().isBlank()) {
            existing.setSlug(request.slug());
        }
        categoryRepository.update(existing);
        return existing;
    }

    @Transactional
    public void deleteCategory(Long id) {
        if (!categoryRepository.existsById(id)) {
            throw new RuntimeException("Категория не найдена");
        }

        if (categoryRepository.hasChildren(id)) {
            throw new RuntimeException("Нельзя удалить категорию, содержащую подкатегории");
        }

        categoryRepository.deleteById(id);
    }

    private String generateSlug(String name) {
        return name.toLowerCase()
                .replaceAll("[^a-z0-9а-яё\\s]", "")
                .replaceAll("\\s+", "-")
                .replaceAll("а", "a").replaceAll("б", "b").replaceAll("в", "v")
                + "-" + System.currentTimeMillis();
    }
}