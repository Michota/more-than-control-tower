import { IsNotEmpty, IsString } from "class-validator";

export class CreateRouteRequestDto {
    /** @example "Route North" */
    @IsString()
    @IsNotEmpty()
    name!: string;
}
