(async ()=>{
  try{
    const res = await fetch('http://localhost:3000/orders', { headers: { 'x-admin-email': 'kishore@gmail.com' } })
    const data = await res.json()
    console.log('Got', data.length, 'orders')
    data.slice(0,6).forEach(o => {
      const util = require('util')
      console.log('id', o.id, 'items typeof', typeof o.items, 'isArray', Array.isArray(o.items))
      if (Array.isArray(o.items) && o.items.length > 0) {
        console.log('first element (inspect):', util.inspect(o.items[0], { depth: null }))
      } else {
        console.log('items empty or not array')
      }
    })
  }catch(err){ console.error(err) }
})();
