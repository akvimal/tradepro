import { Injectable } from "@nestjs/common";
import { WebSocketService } from "../common/websocket.service";

@Injectable()
export class FeedService {

    constructor (private sockService:WebSocketService) {}

    async send(data){
        await this.sockService.sendMessage(data);
    }
}