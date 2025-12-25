package com.scammers.productservice.models;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Table;

@Data
@Table("categories")
@AllArgsConstructor
@NoArgsConstructor
public class Category {
    @Id
    private Long id;
    private String name;
    private Long parentId;
    private String slug;
}
