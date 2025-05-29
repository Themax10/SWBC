const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qirxdlnjyiveqhrstgki.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

exports.handler = async function(event, context) {
  try {
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('*');
    const { data: bets, error: betsError } = await supabase
      .from('bets')
      .select('*');

    if (eventsError || betsError) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Failed to fetch data' })
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ events, bets })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
