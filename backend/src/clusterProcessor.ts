import { fork } from 'child_process';

export const processLargeFile = (filePath: string) => {
  const clusterProcessor = fork('./clusterProcessor.js');
  clusterProcessor.send({ filePath });

  clusterProcessor.on('message', (msg) => {
    console.log(`Cluster processor completed: ${msg}`);
  });
};