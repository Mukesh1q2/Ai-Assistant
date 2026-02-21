import { Queue } from 'bullmq';
import { connection } from './connection';

export const QUEUE_NAME = 'incoming_messages';

// Instantiate the queue
export const messageQueue = new Queue(QUEUE_NAME, {
    connection: connection as any,
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 1000,
        },
        removeOnComplete: true, // Auto-remove completed jobs to save memory
        removeOnFail: false,    // Keep failed jobs for inspection
    },
});

export interface IncomingMessageJob {
    integrationId: string;
    platform: 'telegram' | 'whatsapp';
    messageData: any; // Type varies per platform
}

export async function enqueueMessage(jobData: IncomingMessageJob) {
    await messageQueue.add('process_message', jobData);
}
