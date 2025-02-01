import { Injectable, Logger } from "@nestjs/common";

@Injectable()
export class PriceProcessor {

    private readonly logger = new Logger(PriceProcessor.name);
    constructor(){}

    async process(content: any) {
        // this.logger.debug(`Received Security[${content['security']}], LTP: ${content['ltp']}`);
        //get the pending SL orders for the securities
        //check the price has breached the SL, if so, update SL order to close (virtual - update SL to TRADED with LTP as traded price)
        //if no breach, SL leg has trail flag, get trail config for the strategy and trail accordingly
            // - trail by pcnt from current SL
            // - cost to cost on reaching certain profit level  
            // - previous interval candle low/high
    }
}