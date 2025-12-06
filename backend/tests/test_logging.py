import logging


def test_request_logging(client, caplog):
    """
    GIVEN a running app with logging configured
    WHEN a request is made to any endpoint (e.g., /hello)
    THEN a log entry regarding the request should be captured.
    """
    # Set the capture level to INFO to ensure we catch standard logs
    caplog.set_level(logging.INFO)

    # Make a request
    client.get('/hello')

    # Check if logs contain the method and path
    # We expect our logger to log something like "Request: GET /hello"
    assert "Request: GET /hello" in caplog.text


def test_404_logging(client, caplog):
    """
    GIVEN a running app
    WHEN a request is made to a non-existent route
    THEN a log entry regarding the 404 error should be captured.
    """
    caplog.set_level(logging.INFO)

    client.get('/non-existent-route-12345')

    assert "Request: GET /non-existent-route-12345" in caplog.text
    # We might also want to assert that the status code is logged, depending on implementation
    assert "404" in caplog.text