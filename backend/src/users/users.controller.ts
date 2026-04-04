import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Query,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { UsersService } from './users.service.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { Public } from '../common/decorators/public.decorator.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdatePresetDto } from './dto/update-preset.dto.js';
import { UserResponseDto } from './dto/user-response.dto.js';
import { UserEntity } from './user.entity.js';

@Controller('api/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Public()
  @Get()
  async findByWalletAddress(
    @Query('walletAddress') walletAddress: string,
  ): Promise<UserResponseDto> {
    const user = await this.usersService.findByWalletAddress(walletAddress);
    if (!user) throw new NotFoundException('User not found');
    return UserResponseDto.from(user);
  }

  @Public()
  @Post()
  async createUser(@Body() dto: CreateUserDto): Promise<UserResponseDto> {
    const existing = await this.usersService.findByWalletAddress(dto.walletAddress);
    if (existing) throw new ConflictException('User already exists');
    const user = await this.usersService.create(dto);
    return UserResponseDto.from(user);
  }

  @Get('me')
  getMe(@CurrentUser() user: UserEntity): UserResponseDto {
    return UserResponseDto.from(user);
  }

  @Patch('me/preset')
  async updatePreset(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdatePresetDto,
  ): Promise<UserResponseDto> {
    const user = await this.usersService.updatePreset(userId, dto.preset);
    return UserResponseDto.from(user);
  }
}
