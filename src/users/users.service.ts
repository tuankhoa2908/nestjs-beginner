/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from './schemas/user.schema';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}

  async create(createUserDto: CreateUserDto) {
    const user = await this.userModel.create({
      email: createUserDto.email,
      password: createUserDto.password,
      name: createUserDto.name,
      age: createUserDto?.age,
      address: createUserDto?.address,
    });
    return user;
  }

  findAll() {
    return `This action returns all users`;
  }

  findOne(id: string) {
    return this.userModel.findById(id);
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const user = await this.userModel.findById(id);
    if (!user) {
      throw new Error('User not found');
    }
    const updatedUser: object = await user.updateOne(updateUserDto);
    return updatedUser;
  }

  async remove(id: string) {
    await this.userModel.findByIdAndDelete(id);
    return `Deleted user successfully`;
  }
}
