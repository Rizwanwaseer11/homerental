Remove all CSRF-related imports and middleware
Security is now handled by Helmet headers
Forms no longer need CSRF tokens
Session security is maintained through cookies
Rate limiting provides additional protection



<%- include('../partials/header') %>
</head>

<body class="bg-light min-vh-100 d-flex flex-column ">
<%- include('../partials/nav') %>
 
  <div class="row g-4 mt-2">
    <% if (properties.length === 0) { %>
      <div class="col-12 text-center text-muted py-5">
        <i class="bi bi-house-slash display-4 mb-3"></i><br>
        No property to show
      </div>
    <% } else { %>
      <% properties.forEach(p => { %>
        <div class="col-12 col-sm-6 col-lg-4">
          <div class=" container card h-100 shadow border-0 position-relative">
            <% if (currentUserRole === 'owner' && String(p.ownerId) === String(currentUserId) && p.status === 'rented') { %>
              <span class="position-absolute top-0 end-0 m-2 badge bg-success">Rented</span>
            <% } %>
            <a href="/properties/<%= p._id %>">
              <img src="<%= p.images[0] || '/placeholder.png' %>" alt="img" class="card-img-top" style="height:220px;object-fit:cover;">
            </a>
            <div class=" container d-flex flex-column">
              <h5 class="card-title mb-1"><a href="/properties/<%= p._id %>" class="text-decoration-none text-primary"><%= p.title %></a></h5>
              <p class="card-subtitle text-muted mb-2"><i class="bi bi-geo-alt me-1"></i><%= p.location.city %> &bull; <%= p.category %></p>
              <% if (p.description) { %>
                <p class="small text-muted mb-1"><%= p.description %></p>
              <% } %>
              <% if (p.location.city || p.location.state) { %>
                <p class="small text-muted mb-1">City: <%= p.location.city %> | State: <%= p.location.state %></p>
              <% } %>
              <p class="small text-muted mb-1">Status: <%= p.status %></p>
              <% if (typeof p.rating !== 'undefined') { %>
                <p class="small text-warning mb-1">Rating: <%= p.rating %> / 5</p>
              <% } %>
              <div class="mb-2">
                <% if (p.amenities && p.amenities.length) { %>
                  <% p.amenities.slice(0,3).forEach(a => { %>
                    <span class="badge bg-primary me-1"><%= a %></span>
                  <% }) %>
                  <% if (p.amenities.length > 3) { %>
                    <span class="badge bg-secondary">+<%= p.amenities.length - 3 %> more</span>
                  <% } %>
                <% } %>
              </div>
              <p class="h5 fw-bold text-success mb-2">Rs <%= p.price %> <span class="small text-muted">/<%= p.rentType === 'perNight' ? 'night' : 'month' %></span></p>
              <div class="d-flex justify-content-between align-items-center mt-auto">
                <span class="small text-muted">Bedrooms: <%= p.bedrooms %> | Baths: <%= p.bathrooms %></span>
                <% if (p.featured) { %>
                  <span class="badge bg-warning text-dark ms-2">Featured</span>
                <% } %>
              </div>
            </div>
          </div>
        </div>
      <% }) %>
    <% } %>
  </div>
</div>
</body>
</html>

