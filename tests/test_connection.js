import tap from 'tap';
import Client from '../src/index';

tap.test('test_connection', async (t) => {
  const config = {
    hostname: process.env.LOGSTASH_HOST,
    port: process.env.LOGSTASH_PORT,
  };
  const lstash = new Client({ name: 'test' }, config);
  await lstash.start();
  await lstash.stop();
  t.ok('Should start and stop');
});
