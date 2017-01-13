import tap from 'tap';
import { start, stop } from '../src/index';

tap.test('test_connection', async (t) => {
  const config = {
    host: process.env.LOGSTASH_HOST || 'logstash',
    port: process.env.LOGSTASH_PORT || 9999,
  };
  t.ok(start(config), 'start should return true');
  await stop();
  t.ok('Should start and stop');
});
