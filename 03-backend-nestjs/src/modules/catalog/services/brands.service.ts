import { Injectable } from '@nestjs/common';
import { BrandRepository } from '../repositories/brand.repository';
import { BrandResponseDto } from '../dto/brand-response.dto';
import { toBrandResponse } from '../utils/catalog.mapper';

@Injectable()
export class BrandsService {
  constructor(private readonly brandRepository: BrandRepository) {}

  async listBrands(): Promise<BrandResponseDto[]> {
    const brands = await this.brandRepository.findAll();
    return brands.map(toBrandResponse);
  }
}
