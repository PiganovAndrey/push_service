import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreatePushDto {
    @ApiProperty({
        description: 'Заголовок push-уведомления',
        example: 'У вас новое сообщение!'
    })
    @IsString({ message: 'Заголовок должен быть строкой' })
    @IsNotEmpty({ message: 'Заголовок не должен быть пустым' })
    title: string;

    @ApiProperty({
        description: 'Сообщение push-уведомления',
        example: 'Привет! У вас новое сообщение в приложении.'
    })
    @IsString({ message: 'Сообщение должно быть строкой' })
    @IsNotEmpty({ message: 'Сообщение не должно быть пустым' })
    message: string;

    @ApiProperty({
        description: 'Токен устройства, на которое будет отправлено push-уведомление',
        example: 'dZ1z9Lx_YN4:APA91bH2yX8G...'
    })
    @IsNotEmpty({ message: 'Токен устройства не должен быть пустым' })
    @IsString({ message: 'Токен устройства должен быть строкой' })
    deviceToken: string;

    @ApiProperty({
        description: 'Идентификатор пользователя, которому предназначено push-уведомление',
        example: 'user-uuid-1234'
    })
    @IsNotEmpty({ message: 'Идентификатор пользователя не должен быть пустым' })
    @IsString({ message: 'Идентификатор пользователя должен быть строкой' })
    userUid: string;
}
