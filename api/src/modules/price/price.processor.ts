import { Injectable, Logger } from "@nestjs/common";
import { PriceService } from "./price.service";


@Injectable()
export class PriceProcessor {

    private readonly logger = new Logger(PriceProcessor.name);

    constructor(private readonly priceService:PriceService){}

    async process(content: any) {
        this.logger.debug(`Received Security[${content['security']}], LTP: ${content['ltp']}`);
        // this.priceService.handlePriceChange(content['security'],content['ltp']);
    }
}