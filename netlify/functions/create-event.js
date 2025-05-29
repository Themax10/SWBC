const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qirxdlnjyiveqhrstgki.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

exports.handler = async function(event, context) {
  try {
    const { name, category } = JSON.parse(event.body);
    if (!name || !category) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Name and category are required' })
      };
    }

    const { data, error } = await supabase
      .from('events')
      .insert([{ name, category, status: 'pending', bets: [] }])
      .select();

    if (error) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: error.message })
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify(data[0])
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
