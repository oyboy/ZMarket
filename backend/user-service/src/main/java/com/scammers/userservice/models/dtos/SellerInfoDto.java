package com.scammers.userservice.models.dtos;

import com.scammers.userservice.models.SellerProfile;
import lombok.AllArgsConstructor;
import lombok.Data;

@AllArgsConstructor
@Data
public class SellerInfoDto {
    private String sellerName;
    private String description;

    public static SellerInfoDto from(SellerProfile sellerProfile) {
        return new SellerInfoDto(
            sellerProfile.getCompanyName(),
            sellerProfile.getDescription()
        );
    }
}
