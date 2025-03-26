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
    
    // Only create the table if it doesn't exist
    if ($result->num_rows == 0) {
        // Create table if it doesn't exist
        $sql = "CREATE TABLE IF NOT EXISTS user_locations (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT DEFAULT 1,
            latitude DECIMAL(10, 8) NOT NULL,
            longitude DECIMAL(11, 8) NOT NULL
        )";
        
        if (!$conn->query($sql)) {
            throw new Exception("Error creating table: " . $conn->error);
        }
    }
    
    // Check if latitude and longitude are provided
    if (!isset($_POST['latitude']) || !isset($_POST['longitude'])) {
        echo json_encode([
            'success' => false,
            'message' => 'Latitude and longitude are required'
        ]);
        exit;
    }
    
    // Get latitude and longitude from POST data
    $latitude = floatval($_POST['latitude']);
    $longitude = floatval($_POST['longitude']);
    
    // Validate coordinates
    if ($latitude < -90 || $latitude > 90 || $longitude < -180 || $longitude > 180) {
        echo json_encode([
            'success' => false,
            'message' => 'Invalid coordinates'
        ]);
        exit;
    }
    
    // Prepare and execute the insert statement
    $stmt = $conn->prepare("INSERT INTO user_locations (latitude, longitude) VALUES (?, ?)");
    $stmt->bind_param("dd", $latitude, $longitude);
    
    if ($stmt->execute()) {
        echo json_encode([
            'success' => true,
            'message' => 'Location saved successfully',
            'id' => $conn->insert_id
        ]);
    } else {
        throw new Exception("Error saving location: " . $stmt->error);
    }
    
    $stmt->close();
    $conn->close();
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
?>