const fetch = global.fetch || require('node-fetch');

// Usage: node simulate_orders.js [count] [intervalSeconds]
const count = Number(process.argv[2] || process.env.SIM_COUNT || 5)
const interval = Number(process.argv[3] || process.env.SIM_INTERVAL || 5) * 1000

async function postOrder(i){
  const payload = {
    userEmail: `sim${i}@example.com`,
    items: [ { title: `Sim Product ${i}`, price: (Math.random()*100).toFixed(2), qty: Math.floor(Math.random()*3)+1 } ],
    total: parseFloat((Math.random()*200+10).toFixed(2))
  }
  try{
    const res = await fetch('http://localhost:3000/orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    const body = await res.text()
    console.log('Posted order', i, 'status', res.status, body)
  }catch(err){ console.error('Post failed', err) }
}

async function run(){
  console.log(`Simulating ${count} orders, ${interval/1000}s apart`)
  for(let i=1;i<=count;i++){
    await postOrder(i)
    if(i < count) await new Promise(r=>setTimeout(r, interval))
  }
  console.log('Simulation complete')
}

run()
