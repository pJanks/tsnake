<?php
  try {
    require_once '../config.php';
    
    $date = new DateTime();
    $formattedDate = $date->format('m.d.y h:i:s A');

    $scoreData = json_decode(file_get_contents('php://input'));
    $score = $scoreData->score;
    $name = $scoreData->name;
    $time = $scoreData->time;
    $pills_eaten = $scoreData->pills_eaten;
    
    $sql = 'INSERT INTO scores (score, name, time, pills_eaten) VALUES (:score, :name, :time, :pills_eaten)';
    $stmt = $pdo->prepare($sql);
    $stmt->bindParam(':score', $score);
    $stmt->bindParam(':name', $name);
    $stmt->bindParam(':time', $time);
    $stmt->bindParam(':pills_eaten', $pills_eaten);
    $stmt->execute();

    $successMessage = "$formattedDate inserted into scores\n";
    
    file_put_contents('../logs/log.log', $successMessage, FILE_APPEND);
    // echo json_encode(['success' => true]);
    echo json_encode(['pills_eaten' => $pills_eaten]);
    unset($stmt);
    unset($pdo);
  } catch(PDOException $e) {
    $errorMessage = $formattedDate . ' ERROR INSERTING INTO scores TABLE: ' . $e->getMessage() . ' line: ' . $e->getLine() . "\n";
    file_put_contents('../logs/error.log', $errorMessage, FILE_APPEND);
    echo '<h1 style="color: #F00; font-size: 240%; font-weight: bold;">ERROR</h1>';
  }