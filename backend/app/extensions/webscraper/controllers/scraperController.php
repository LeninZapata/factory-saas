<?php
class scraperController {

  function createJob($data) {
    ogValidation::required($data, ['url', 'selector']);

    // Guardar en tabla del extension
    $jobId = ogDb::table('scraper_jobs')->insert([
      'url' => $data['url'],
      'selector' => $data['selector'],
      'status' => 'pending',
      'created_at' => date('Y-m-d H:i:s')
    ]);

    ogResponse::success(['job_id' => $jobId], 'Job created', 201);
  }

  function runJob($id) {
    $job = ogDb::table('scraper_jobs')->find($id);
    if (!$job) ogResponse::notFound('Job not found');

    // Usar servicio del extension
    $scraper = new puppeteerService();
    $result = $scraper->scrape($job['url'], $job['selector']);

    // Guardar resultado
    ogDb::table('scraper_results')->insert([
      'job_id' => $id,
      'data' => json_encode($result),
      'created_at' => date('Y-m-d H:i:s')
    ]);

    // Actualizar estado
    ogDb::table('scraper_jobs')
      ->where('id', $id)
      ->update(['status' => 'completed']);

    ogResponse::success($result);
  }

  function getResults($id) {
    $results = ogDb::table('scraper_results')
      ->where('job_id', $id)
      ->get();

    ogResponse::success($results);
  }
}