package com.scammers.productservice.repositories;

import com.scammers.productservice.models.Category;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

import java.sql.PreparedStatement;
import java.sql.Statement;
import java.sql.Types;
import java.util.List;

@Repository
@RequiredArgsConstructor
public class CategoryRepository {
    private final JdbcTemplate jdbcTemplate;

    public Long save(Category category) {
        String sql = "INSERT INTO categories (name, parent_id, slug) VALUES (?, ?, ?)";

        KeyHolder keyHolder = new GeneratedKeyHolder();

        jdbcTemplate.update(connection -> {
            PreparedStatement ps = connection.prepareStatement(sql, new String[] {"id"});

            ps.setString(1, category.getName());
            if (category.getParentId() == null) {
                ps.setNull(2, Types.BIGINT);
            } else {
                ps.setLong(2, category.getParentId());
            }
            ps.setString(3, category.getSlug());
            return ps;
        }, keyHolder);

        Number key = keyHolder.getKey();
        if (key == null) {
            throw new RuntimeException("Не удалось сохранить категорию");
        }
        return key.longValue();
    }

    public void update(Category category) {
        String sql = "UPDATE categories SET name = ?, parent_id = ?, slug = ? WHERE id = ?";
        jdbcTemplate.update(sql,
                category.getName(),
                category.getParentId(),
                category.getSlug(),
                category.getId()
        );
    }

    public void deleteById(Long id) {
        String sql = "DELETE FROM categories WHERE id = ?";
        jdbcTemplate.update(sql, id);
    }

    public Category findById(Long id) {
        try {
            String sql = "SELECT * FROM categories WHERE id = ?";
            return jdbcTemplate.queryForObject(sql, categoryRowMapper, id);
        } catch (EmptyResultDataAccessException e) {
            return null;
        }
    }

    public boolean hasChildren(Long id) {
        String sql = "SELECT count(*) FROM categories WHERE parent_id = ?";
        Integer count = jdbcTemplate.queryForObject(sql, Integer.class, id);
        return count != null && count > 0;
    }

    private final RowMapper<Category> categoryRowMapper = (rs, rowNum) -> new Category(
            rs.getLong("id"),
            rs.getString("name"),
            rs.getObject("parent_id", Long.class),
            rs.getString("slug")
    );

    public boolean existsById(Long id) {
        if (id == null) return false;
        String sql = "SELECT count(*) FROM categories WHERE id = ?";
        Integer count = jdbcTemplate.queryForObject(sql, Integer.class, id);
        return count != null && count > 0;
    }

    public List<Category> findAll() {
        String sql = "SELECT * FROM categories ORDER BY id ASC";
        return jdbcTemplate.query(sql, categoryRowMapper);
    }
}