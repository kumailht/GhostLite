import { JobsService } from './jobs-service';
import ExternalMediaInliner from '../media-inliner/external-media-inliner';
import ExternalMediaInlinerJob from '../media-inliner/external-media-inliner-job';
import ContentCSVImportJob from '../content-import/jobs/content-csv-import-job';
import * as contentImport from '../content-import';
import ContentImportJob from '../../data/importer/jobs/content-import-job';
import CheckSigningKeysJob from '../signing-keys/check-signing-keys-job';
import * as signingKeys from '../signing-keys';

interface RegisterJobHandlersDependencies {
  jobsService: JobsService;
  mediaInliner: ExternalMediaInliner;
  siteImporter: {
    executeImport(job: ContentImportJob): Promise<unknown>;
  };
}

export default function registerJobHandlers({
  jobsService,
  mediaInliner,
  siteImporter,
}: RegisterJobHandlersDependencies): void {
  jobsService.handle(ExternalMediaInlinerJob, async (job) => {
    await mediaInliner.inline(job.domains);
  });

  jobsService.handle(ContentCSVImportJob, async (job) => {
    await contentImport.handleJob(job);
  });

  jobsService.handle(ContentImportJob, async (job) => {
    await siteImporter.executeImport(job);
  });

  jobsService.handle(CheckSigningKeysJob, async () => {
    await signingKeys.getInstance().check();
  });
}
