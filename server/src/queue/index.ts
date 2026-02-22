import { Queue } from 'bullmq';
import { connection } from './connection';

export const QUEUE_NAME = 'incoming_messages';

// Only create queue if Redis connection is available
export const messageQueue = connection ? new Queue(QUEUE_NAME, {
    connection: connection as any,
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 1000,
        },
        removeOnComplete: true,
        removeOnFail: false,
    },
}) : null;

export interface IncomingMessageJob {
    integrationId: string;
    platform: 'telegram' | 'whatsapp';
    messageData: any;
}

export async function enqueueMessage(jobData: IncomingMessageJob) {
    if (!messageQueue) {
        console.warn('⚠️  Queue unavailable — message not enqueued');
        return;
    }
    await messageQueue.add('process_message', jobData);
}
