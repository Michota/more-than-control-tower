import { IsNotEmpty, IsString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

/**
 * OAuth2 password flow DTO — accepts form-urlencoded `username` + `password`.
 * Used by Swagger UI's Authorize dialog so users can log in without copy-pasting tokens.
 */
export class OAuth2TokenRequestDto {
    @ApiProperty({ description: "User email address" })
    @IsString()
    @IsNotEmpty()
    username!: string;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    password!: string;
}
