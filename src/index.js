import assert from 'assert';
import winston from 'winston';

export default class ConfiguredWinstonLogstash {
  constructor(context, opts) {
    assert(opts, 'configured-winston-logstash must be passed arguments');

    // eslint-disable-next-line global-require, import/newline-after-import
    require('winston-logstash');
    winston.add(winston.transports.Logstash, {
      level: 'info',
      port: opts.port || 9999,
      host: opts.hostname || 'logstash',
      node_name: context.name,
    });
    const logTransport = winston.default.transports.logstash;
    logTransport.on('error', (error) => {
      // eslint-disable-next-line no-console
      console.error('logstash error', error.message, error.stack);
    });
    winston.info('Started LogStash logging');
  }

  // eslint-disable-next-line class-methods-use-this
  start() {
    return null;
  }

  // eslint-disable-next-line class-methods-use-this
  async stop() {
    winston.info('Disconnecting from logstash.');
    const logTransport = winston.default.transports.logstash;
    let queued = logTransport.getQueueLength();
    const messages = logTransport.log_queue;

    if (queued > 0) {
      let flushed = false;
      // Three things might happen here:
      // 1. An error occurs on the transport and any queued messages are dumped.
      // 2. Queued messages slowly drain out
      // 3. Time passes and 1 and 2 don't complete
      await new Promise((accept) => {
        const timeoutId = setTimeout(() => {
          if (!flushed) {
            flushed = true;
            // eslint-disable-next-line no-console
            console.error('Unable to flush logstash queue. Dumping queued messages.');
            for (const msg of messages) {
              // eslint-disable-next-line no-console
              console.error(msg);
            }
            accept();
          }
        }, 10000);
        logTransport.on('error', () => {
          if (!flushed) {
            flushed = true;
            clearTimeout(timeoutId);
            // eslint-disable-next-line no-console
            console.error('logstash encountered error on shutdown. Dumping queued messages.');
            for (const msg of messages) {
              // eslint-disable-next-line no-console
              console.error(msg);
            }
            accept();
          }
        });
        logTransport.on('logged', () => {
          queued -= 1;
          if (queued === 1) {
            process.nextTick(() => {
              if (!flushed) {
                clearTimeout(timeoutId);
                flushed = true;
                accept();
              }
            });
          }
        });
      });
      winston.remove(logTransport);
    } else {
      winston.remove(logTransport);
    }
  }
}
