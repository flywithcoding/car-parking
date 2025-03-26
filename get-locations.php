<?php
// Set headers for JSON response
header('Content-Type: application/json');

// Database configuration - Updated with your database name
$db_host = 'localhost';
$db_user = 'root';
$db_pass = 'passdimuna#19';
$db_name = 'car_parking_db'; // Updated to your database name

// Connect to database
try {
    $conn = new mysqli($db_host, $db_user, $db_pass, $db_name);
    
    // Check connection
    if ($conn->connect_error) {
        throw new Exception("Connection failed: " . $conn->connect_error);
    }
    
    // Check if table exists
    $result = $conn->query("SHOW TABLES LIKE 'user_locations'");
    if ($result->num_rows == 0) {
        // Table doesn't exist, return empty array
        echo json_encode([
            'locations' => []
        ]);
        exit;
    }
    
    // Get the most recent locations (limit to 10)
    $sql = "SELECT * FROM user_locations ORDER BY created_at DESC LIMIT 10";
    $result = $conn->query($sql);
    
    if (!$result) {
        throw new Exception("Error retrieving locations: " . $conn->error);
    }
    
    $locations = [];
    
    while ($row = $result->fetch_assoc()) {
        $locations[] = $row;
    }
    
    echo json_encode([
        'locations' => $locations
    ]);
    
    $conn->close();
    
} catch (Exception $e) {
    echo json_encode([
        'error' => $e->getMessage()
    ]);
}
?>