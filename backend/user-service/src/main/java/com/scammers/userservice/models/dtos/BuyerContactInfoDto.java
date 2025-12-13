package com.scammers.userservice.models.dtos;

import com.scammers.userservice.models.BuyerProfile;
import com.scammers.userservice.models.User;
import lombok.Builder;
import lombok.Getter;

@Builder
@Getter
public class BuyerContactInfoDto {
    private String firstName;
    private String lastName;
    private String email;
    private String phone;

    public static BuyerContactInfoDto from(BuyerProfile profile) {
        User user = profile.getUser();

        return BuyerContactInfoDto.builder()
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .email(user.getEmail())
                .phone(profile.getPhoneNumber())
                .build();
    }
}
