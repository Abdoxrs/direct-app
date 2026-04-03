import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Url } from './entities/url.entity';

@Injectable()
export class UrlsRepository {
  constructor(
    @InjectRepository(Url)
    private urlRepository: Repository<Url>,
  ) {}

  // Custom queries can be added here
}