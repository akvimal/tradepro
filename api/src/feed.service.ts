import { Injectable } from "@nestjs/common";
import { io, Socket } from 'socket.io-client';

@Injectable()
export class FeedService {

    private socket: Socket;

    constructor () {
        const token = `eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9.eyJpc3MiOiJkaGFuIiwicGFydG5lcklkIjoiIiwiZXhwIjoxNzM1Nzg1MjU0LCJ0b2tlbkNvbnN1bWVyVHlwZSI6IlNFTEYiLCJ3ZWJob29rVXJsIjoiaHR0cDovLzg5LjIzMy4xMDQuMjo5MDkwL29yZGVyL2ZlZWRiYWNrL2RoYW4iLCJkaGFuQ2xpZW50SWQiOiIxMTAxMTIxNTE1In0.DIoESWnDxtUYzAjCdD8z-DWB7dBWQceOEySLTt2i6rsyHZkpFe8YLbBkW-YiGbPwStPuDWBkkRhg7oT0kKDsvA`;
        const clientId = `1101121515`;
        console.log('connecting ws ...');
        const url = `wss://api-feed.dhan.co?version=2&token=${token}&clientId=${clientId}&authType=2`
        console.log(url);
        
        this.socket = io(url);
        // this.socket = io(url,{extraHeaders: {
        //     "Access-Control-Allow-Origin": "*"
        //   }});
        this.socket.on('message', (data) => {
            console.log('received',data);
            
            // subscriber.next(data);
        });
    }

    send(data){
        this.socket.emit('message', data);
        console.log('data sent');
        
    }
}