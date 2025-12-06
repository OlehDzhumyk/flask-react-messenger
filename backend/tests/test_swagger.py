def test_swagger_ui_loads(client):
    """
    GIVEN a running app with Flasgger configured
    WHEN a request is made to /apidocs/
    THEN the Swagger UI HTML page should be returned (Status 200).
    """
    # Flasgger default route is /apidocs/
    response = client.get('/apidocs/')

    # We allow 200 (OK) or 308 (Redirect to adds trailing slash)
    assert response.status_code in [200, 308, 301]

    # If redirect, follow it
    if response.status_code in [301, 308]:
        response = client.get('/apidocs/', follow_redirects=True)
        assert response.status_code == 200

    # Verify content looks like Swagger UI
    assert b'swagger' in response.data.lower()