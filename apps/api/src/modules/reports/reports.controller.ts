import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Role } from '@prisma/client';
import { ReportsService } from './reports.service';
import { Roles } from '../../common/decorators/roles.decorator';

class DateRangeDto {
  @Type(() => Date) @IsDate() from!: Date;
  @Type(() => Date) @IsDate() to!: Date;
}

class TopItemsQueryDto extends DateRangeDto {
  @IsOptional() @IsInt() @Min(1) limit?: number;
}

class CustomersQueryDto {
  @IsOptional() @IsString() search?: string;
  @IsOptional() @IsInt() @Min(1) page?: number;
  @IsOptional() @IsInt() @Min(1) pageSize?: number;
}

@ApiTags('admin/reports')
@Controller('admin/reports')
@Roles(Role.OWNER, Role.MANAGER)
export class ReportsController {
  constructor(private readonly reports: ReportsService) {}

  @Get('dashboard')
  dashboard() {
    return this.reports.dashboardStats();
  }

  @Get('sales')
  sales(@Query() q: DateRangeDto) {
    return this.reports.salesReport(q);
  }

  @Get('top-items')
  topItems(@Query() q: TopItemsQueryDto) {
    return this.reports.topItemsReport(q);
  }

  @Get('customers')
  customers(@Query() q: CustomersQueryDto) {
    return this.reports.customersReport(q);
  }

  @Get('coupons')
  coupons(@Query() q: DateRangeDto) {
    return this.reports.couponPerformance(q);
  }
}
