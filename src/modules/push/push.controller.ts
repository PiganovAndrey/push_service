import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    Delete,
    Inject,
    LoggerService,
    HttpException,
    HttpStatus,
    UseInterceptors,
    Req,
    NotFoundException,
    Put
} from '@nestjs/common';
import { PushService } from './push.service';
import { CreatePushDto } from './dto/create-push.dto';
import { UpdatePushDto } from './dto/update-push.dto';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Role } from 'src/common/enums/roles.enum';
import { LoggingInterceptor } from 'src/common/interceptors/LoggingInterceptor';
import ITokenData from 'src/common/interfaces/token.data';
import { KafkaRetriableException, MessagePattern, Payload } from '@nestjs/microservices';
import { ViewPayloadDto } from './dto/view.payload.dto';
import { ApiOperation, ApiParam, ApiResponse, ApiBody, ApiTags } from '@nestjs/swagger';

@ApiTags('Push Notifications')
@Controller()
@UseInterceptors(LoggingInterceptor)
export class PushController {
    constructor(
        private readonly pushService: PushService,
        @Inject(WINSTON_MODULE_NEST_PROVIDER) private readonly logger: LoggerService
    ) {}

    @Get('/')
    @ApiOperation({ summary: 'Получение всех уведомлений' })
    @ApiResponse({ status: 200, description: 'Список всех уведомлений' })
    @ApiResponse({ status: 500, description: 'Внутренняя ошибка сервера' })
    @Roles(Role.ALL)
    getAllNotifications() {
        try {
            return this.pushService.getAllNotifications();
        } catch (e) {
            this.logger.error(`Error in pushController:\n${e}`);
            throw new HttpException('Ошибка при получении уведомлений', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Get('/user_uid')
    @ApiOperation({ summary: 'Получение уведомлений пользователя по UID' })
    @ApiResponse({ status: 200, description: 'Список уведомлений пользователя' })
    @ApiResponse({ status: 404, description: 'Уведомлений не найдено' })
    @ApiResponse({ status: 500, description: 'Внутренняя ошибка сервера' })
    @Roles(Role.ALL)
    async getUserNotifications(@Req() req: Request) {
        try {
            const user: ITokenData = req['sessionData'];
            const result = await this.pushService.getUserNotifications(user.userUid);
            if (!result) throw new NotFoundException('Уведомлений не найдены');
            return result;
        } catch (e) {
            this.logger.error(`Error in pushController:\n${e}`);
            throw new HttpException('Ошибка при получение уведомлений пользователя', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Get('/:id')
    @ApiOperation({ summary: 'Получение уведомления по ID' })
    @ApiParam({ name: 'id', description: 'ID уведомления', type: String })
    @ApiResponse({ status: 200, description: 'Информация об уведомлении' })
    @ApiResponse({ status: 500, description: 'Внутренняя ошибка сервера' })
    @Roles(Role.ALL)
    getNotificationById(@Param('id') id: string) {
        try {
            return this.pushService.getNotificationById(id);
        } catch (e) {
            this.logger.error(`Error in pushController:\n${e}`);
            throw new HttpException('Ошибка при получении уведомления по id', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Post('/')
    @ApiOperation({ summary: 'Создание нового уведомления' })
    @ApiBody({ type: CreatePushDto, description: 'Данные для создания уведомления' })
    @ApiResponse({ status: 201, description: 'Уведомление успешно создано' })
    @ApiResponse({ status: 500, description: 'Внутренняя ошибка сервера' })
    @Roles(Role.ALL)
    createNotification(@Body() dto: CreatePushDto) {
        try {
            return this.pushService.createNotification(dto);
        } catch (e) {
            this.logger.error(`Error in pushController:\n${e}`);
            throw new HttpException('Ошибка при создании уведомлений', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Put('/:id')
    @ApiOperation({ summary: 'Обновление уведомления по ID' })
    @ApiParam({ name: 'id', description: 'ID уведомления', type: String })
    @ApiBody({ type: UpdatePushDto, description: 'Данные для обновления уведомления' })
    @ApiResponse({ status: 200, description: 'Уведомление успешно обновлено' })
    @ApiResponse({ status: 500, description: 'Внутренняя ошибка сервера' })
    @Roles(Role.ALL)
    updateNotificationById(@Param('id') id: string, @Body() dto: UpdatePushDto) {
        try {
            return this.pushService.updateNotificationById(id, dto);
        } catch (e) {
            this.logger.error(`Error in pushController:\n${e}`);
            throw new HttpException('Ошибка при обновлении уведомления', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Put('/view/:id')
    @ApiOperation({ summary: 'Пометить уведомление как просмотренное по ID' })
    @ApiParam({ name: 'id', description: 'ID уведомления', type: String })
    @ApiResponse({ status: 200, description: 'Уведомление помечено как просмотренное' })
    @ApiResponse({ status: 500, description: 'Внутренняя ошибка сервера' })
    @Roles(Role.ALL)
    markIsViewById(@Param('id') id: string) {
        try {
            return this.pushService.markIsViewById(id);
        } catch (e) {
            this.logger.error(`Error in pushController:\n${e}`);
            throw new HttpException(
                'Ошибка при указании просмотренности уведомления',
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    @Delete('/:id')
    @ApiOperation({ summary: 'Удаление уведомления по ID' })
    @ApiParam({ name: 'id', description: 'ID уведомления', type: String })
    @ApiResponse({ status: 200, description: 'Уведомление успешно удалено' })
    @ApiResponse({ status: 500, description: 'Внутренняя ошибка сервера' })
    @Roles(Role.ALL)
    deleteNotificationById(@Param('id') id: string) {
        try {
            return this.pushService.deleteNotificationById(id);
        } catch (e) {
            this.logger.error(`Error in pushController:\n${e}`);
            throw new HttpException('Ошибка при удалении уведомления', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @MessagePattern('push.create')
    @Roles(Role.ALL)
    kafkaCreateNotification(@Payload() dto: CreatePushDto) {
        try {
            return this.pushService.createNotification(dto);
        } catch (e) {
            this.logger.error(`Error in pushController:\n${e}`);
            throw new KafkaRetriableException('Ошибка при создании уведомлений');
        }
    }

    @MessagePattern('push.view')
    @Roles(Role.ALL)
    kafkaMarkIsViewById(@Payload() payload: ViewPayloadDto) {
        try {
            return this.pushService.markIsViewById(payload.id);
        } catch (e) {
            this.logger.error(`Error in pushController:\n${e}`);
            throw new KafkaRetriableException('Ошибка при указании просмотренности уведомления');
        }
    }
}
