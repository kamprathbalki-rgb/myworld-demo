const axios = require('axios')

const SELL_DO_API = 'http://app.sell.do/api/leads/create'

async function pushLeadToSellDo(lead) {
  try {
    const params = {
      api_key: process.env.SELLDO_API_KEY,

      // Mapping your CRM → Sell.Do
      name: lead.name,
      mobile: lead.phone,
      email: lead.email,
      project: lead.projectName || 'Default Project',
      source: lead.source || 'website',
      msg: lead.comments || 'New Lead from CRM',

      // optional fields
      City: lead.city || '',
      dt: new Date().toISOString().slice(0,10).replace(/-/g, ''),
      time: new Date().toTimeString().slice(0,8).replace(/:/g,'')
    }

    const response = await axios.get(SELL_DO_API, { params })

    return response.data

  } catch (error) {
    console.error('Sell.Do API Error:', error.message)
    throw error
  }
}

module.exports = { pushLeadToSellDo }