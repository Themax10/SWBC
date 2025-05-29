const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qirxdlnjyiveqhrstgki.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

exports.handler = async function(event, context) {
  try {
    const { bettor, event_id, prediction, stake, deadline } = JSON.parse(event.body);
    if (!bettor || !event_id || !prediction || !stake) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Required fields are missing' })
      };
    }

    const { data, error } = await supabase
      .from('bets')
      .insert([{ bettor, event_id, prediction, stake, status: 'pending', deadline }])
      .select();

    if (error) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: error.message })
      };
    }

    const { data: eventData, error: eventError } = await supabase
      .from('events')
      .select('bets')
      .eq('id', event_id)
      .single();

    if (eventError) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: eventError.message })
      };
    }

    const updatedBets = [...(eventData.bets || []), data[0].id];
    await supabase
      .from('events')
      .update({ bets: updatedBets })
      .eq('id', event_id);

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
