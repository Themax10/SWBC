const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qirxdlnjyiveqhrstgki.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

exports.handler = async function(event, context) {
  try {
    const { id, status } = JSON.parse(event.body);
    if (!id || !status) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'ID and status are required' })
      };
    }

    const updateData = { status };
    if (status === 'paid') {
      updateData.paid_date = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('bets')
      .update(updateData)
      .eq('id', id)
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
