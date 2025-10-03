<?php
require __DIR__ . '/config.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
  if (isset($_GET['date'])) {
    $date = $_GET['date'];
    $stmt = db()->prepare("SELECT * FROM planner_items WHERE date = ? ORDER BY COALESCE(start_time, '99:99'), id");
    $stmt->execute([$date]);
    json_out(['items' => $stmt->fetchAll()]);
  }

  if (isset($_GET['month'])) {
    $month = $_GET['month']; // "YYYY-MM"
    $start = $month . "-01";
    $end   = date("Y-m-d", strtotime("$start +1 month"));
    $sql = "SELECT date,
                   SUM(priority='low')  AS low,
                   SUM(priority='med')  AS med,
                   SUM(priority='high') AS high,
                   COUNT(*) AS total
            FROM planner_items
            WHERE date >= ? AND date < ?
            GROUP BY date";
    $stmt = db()->prepare($sql);
    $stmt->execute([$start,$end]);
    $rows = $stmt->fetchAll();
    $out = [];
    foreach ($rows as $r) {
      $out[$r['date']] = [
        'low' => (int)$r['low'],
        'med' => (int)$r['med'],
        'high'=> (int)$r['high'],
        'total'=>(int)$r['total']
      ];
    }
    json_out(['counts' => $out]);
  }

  json_out(['error' => 'Missing query'], 400);
}

if ($method === 'POST') {
  $input = json_decode(file_get_contents('php://input'), true) ?? [];
  $action = $input['action'] ?? '';

  if ($action === 'save') {
    $id   = $input['id']   ?? null;
    $date = $input['date'] ?? null;
    $subject = trim($input['subject'] ?? '');
    $topic   = trim($input['topic'] ?? '');
    $notes   = trim($input['notes'] ?? '');
    $start   = $input['start_time'] ?? null;
    $end     = $input['end_time']   ?? null;
    $priority= $input['priority']   ?? 'med';

    if (!$date || !$subject || !$topic) {
      json_out(['error'=>'date, subject, topic are required'], 422);
    }
    if (!in_array($priority, ['low','med','high'], true)) $priority = 'med';

    if ($id) {
      $sql = "UPDATE planner_items
                 SET date=?, subject=?, topic=?, notes=?, start_time=?, end_time=?, priority=?
               WHERE id=?";
      $stmt = db()->prepare($sql);
      $stmt->execute([$date,$subject,$topic,$notes?:null,$start?:null,$end?:null,$priority,$id]);

      $stmt = db()->prepare("SELECT * FROM planner_items WHERE id=?");
      $stmt->execute([$id]);
      json_out(['item'=>$stmt->fetch()]);
    } else {
      $sql = "INSERT INTO planner_items (date,subject,topic,notes,start_time,end_time,priority)
              VALUES (?,?,?,?,?,?,?)";
      $stmt = db()->prepare($sql);
      $stmt->execute([$date,$subject,$topic,$notes?:null,$start?:null,$end?:null,$priority]);
      $newId = db()->lastInsertId();
      $stmt = db()->prepare("SELECT * FROM planner_items WHERE id=?");
      $stmt->execute([$newId]);
      json_out(['item'=>$stmt->fetch()], 201);
    }
  }

  if ($action === 'delete') {
    $id = $input['id'] ?? null;
    if (!$id) json_out(['error'=>'missing id'], 422);
    $stmt = db()->prepare("DELETE FROM planner_items WHERE id=?");
    $stmt->execute([$id]);
    json_out(['ok'=>true]);
  }

  json_out(['error'=>'unknown action'], 400);
}

json_out(['error'=>'method not allowed'], 405);
