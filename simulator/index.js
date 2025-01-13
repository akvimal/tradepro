const fs = require('fs');
const csv = require('csv-parser');
const axios = require('axios');

const signals = []

async function load(){
    setTimeout(() => {
        loadFile('data/Backtest 1min breakout bearish, Technical Analysis Scanner.csv','bearish')    
        console.log('done bearish');
        
    }, 500);
    setTimeout(() => {
        loadFile('data/Backtest 1min breakout bullish, Technical Analysis Scanner.csv','bullish')
        console.log('done bullish');
    }, 1000);
    setTimeout(() => {
        // console.log(signals);
        i = 0;
        setInterval(async () => {
            if(signals[i].bullish)
                await axios.post('http://localhost:3000/signal/chartink/1/Bullish', {stocks:signals[i].bullish,triggered_at:signals[i].date})
            if(signals[i].bearish)
                await axios.post('http://localhost:3000/signal/chartink/1/Bearish', {stocks:signals[i].bearish,triggered_at:signals[i].date})
            console.log(i);
            i++;
        }, 5000);
    },1500);
    
    
    
}

function loadFile(file,direction){
    
    fs.createReadStream(file)
        .pipe(csv({skipLines: 0}))
        .on('data', async (data) => {
            const found = signals.find(s => s.date == data['date'])
            if(found){
                if(direction == 'bearish')
                    found['bearish'] = (found['bearish'] ? found['bearish'] + ',' : '' ) + data['symbol'];
                if(direction == 'bullish')
                    found['bullish'] = (found['bullish'] ? found['bullish'] + ',' : '')+ data['symbol'];
            }
            else {
                if(direction == 'bearish')
                    signals.push({date:data['date'],bearish:data['symbol']})
                if(direction == 'bullish')
                    signals.push({date:data['date'],bullish:data['symbol']})
            }
        })
}

load();

