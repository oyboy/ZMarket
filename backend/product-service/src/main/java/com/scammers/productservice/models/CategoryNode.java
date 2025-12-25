package com.scammers.productservice.models;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class CategoryNode {
    private Long id;
    private String name;
    private String slug;
    private List<CategoryNode> children = new ArrayList<>();

    public CategoryNode(Category category) {
        this.id = category.getId();
        this.name = category.getName();
        this.slug = category.getSlug();
    }
}
