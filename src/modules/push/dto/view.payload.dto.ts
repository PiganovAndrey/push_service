import { IsMongoId, IsNotEmpty } from 'class-validator';

export class ViewPayloadDto {
    @IsMongoId()
    @IsNotEmpty()
    id: string;
}
