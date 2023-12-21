const express = require('express');
const ejs = require('ejs');
const server = express();
const sqlite3 = require('sqlite3');
const db = new sqlite3.Database('demo.db');
const session = require('node-sessionstorage');
const multer = require('multer');
const path = require('path');
const bodyParser = require('body-parser');


server.use(express.static('public'));
server.set('view engine', 'ejs');
server.use(express.urlencoded({ extended: true }));
server.use(bodyParser.json());
const upload = multer({
    storage: multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, 'public/uploads');
        },
        filename: function (req, file, cb) {
            cb(null, Date.now() + '-' + file.originalname);
        }
    })
});

// Middleware to check user authentication
server.use(function (req, res, next) {
    if (req.url === '/login' || req.url === '/logout') {
        next();
    } else {
        let check = session.getItem('admin_login') ? true : false;

        if (check) {
            next();
        } else {
            res.redirect('/login');
        }
    }
});

// Routes
server.get('/', function (req, res) {
    res.render("home", { title: "Home Page" });
});

server.get('/gioi-thieu', function (req, res) {
    res.render("about", { title: "About Page" });
});

server.get('/category', function (req, res) {
    db.all('SELECT id, name, price, image_path FROM category', (err, rows) => {
        if (err) {
            console.error(err.message);
            res.status(500).send('Internal Server Error');
        } else {
            res.render('category', { categories: rows });
        }
    });
   
});

server.get('/delete-category/:id', function (req, res) {
    let id = req.params.id;
    let query = 'DELETE FROM category WHERE id= ?';

    db.run(query, [id], function (err) {
        if (!err) {
            res.redirect('/category');
        } else {
            console.error(err.message);
            res.status(500).send('Internal Server Error');
        }
    });
});

server.get('/create-category/', function (req, res) {
    res.render('create-category');
});

server.get('/artist-create/', function (req, res) {
    res.render('artist-create');
});
server.post('/create-category', upload.single('categoryImage'), function (req, res) {
    const formData = req.body;
    const categoryImage = req.file;

    // Validate form data and file upload
    if (!formData.name || !formData.price || !categoryImage) {
        return res.status(400).send('Bad Request: Missing required data');
    }

    // Insert into the category table, including the image path
    const insertQuery = 'INSERT INTO category (name, price, image_path) VALUES (?, ?, ?)';
    db.run(insertQuery, [formData.name, formData.price, '/uploads/' + categoryImage.filename], function (err) {
        if (err) {
            console.error(err.message);
            return res.status(500).send('Internal Server Error');
        }

        res.redirect('/category');
    });
});
server.post('/artist-create', upload.single('categoryImage'), function (req, res) {
    const formData = req.body;
    const categoryImage = req.file;

    // Validate form data and file upload
    if (!formData.name || !formData.price || !categoryImage) {
        return res.status(400).send('Bad Request: Missing required data');
    }

    // Insert into the category table, including the image path
    const insertQuery = 'INSERT INTO category (name, price, image_path) VALUES (?, ?, ?)';
    db.run(insertQuery, [formData.name, formData.price, '/uploads/' + categoryImage.filename], function (err) {
        if (err) {
            console.error(err.message);
            return res.status(500).send('Internal Server Error');
        }

        res.redirect('/artist');
    });
});

server.get('/edit-category/:id', function (req, res) {
    let id = req.params.id;
    let query = 'SELECT * FROM category WHERE id=?';

    db.get(query, [id], function (err, category) {
        if (!err) {
            res.render('edit-category', {
                category: category
            });
        } else {
            console.error(err.message);
            res.status(500).send('Internal Server Error');
        }
    });
});


server.post('/edit-category/:id', function (req, res) {
    let id = req.params.id;
    let formData = req.body;
    let query = 'UPDATE category SET name=?, price=? WHERE id=?';

    db.run(query, [formData.name, formData.price, id], function (err) {
        if (!err) {
            res.redirect('/category');
        } else {
            console.error(err.message);
            res.status(500).send('Internal Server Error');
        }
    });
});

server.get('/login', function (req, res) {
    res.render('login', { message: null });
});

server.post('/login', function (req, res) {
    let query = "SELECT * FROM account WHERE email=? AND password=?";
    db.all(query, [req.body.email, req.body.password], function (err, data) {
        if (!err && data.length > 0) {
            session.setItem('admin_login', data[0].name);
            if (data[0].role === 'customer') {
                res.redirect('/customer');
                //console.log(data[0]);
            } else if( data[0].role === 'artist') {
                res.redirect('/artist');
                //console.log(data[0]);
            }else {
                res.redirect('/category');
               // console.log(data[0]);
            }
        } else {
            res.render('login', {
                message: 'Invalid account'
            });
        }
    });
});
server.get('/artist', function (req, res) {
    db.all('SELECT id, name, price, image_path FROM category', (err, rows) => {
        if (err) {
            console.error(err.message);
            res.status(500).send('Internal Server Error');
        } else {
            res.render('artist', { categories: rows });
        }
    });
});
server.get('/logout', function (req, res) {
    session.removeItem('admin_login');
    res.redirect('/login');
});

server.get('/customer', function (req, res) {
    db.all('SELECT id, name, price, image_path FROM category', (err, rows) => {
        if (err) {
            console.error(err.message);
            res.status(500).send('Internal Server Error');
        } else {
            res.render('customer', { categories: rows });
        }
    });
});

server.get('/user', function (req, res) {
    db.all('SELECT id, name, email, role  FROM account', (err, rows) => {
        if (err) {
            console.error(err.message);
            res.status(500).send('Internal Server Error');
        } else {
            res.render('user', { categories: rows });
        }
    });
});

server.get('/add-user', function (req, res) {
    res.render('add-user');
});

server.post('/add-user', function (req, res) {
    const formData = req.body;
    //console.log(formData);

    if (!formData.name || !formData.email || !formData.role || !formData.password) {
        return res.status(400).send('Bad Request: Missing required data');
    }


    const emailCheckQuery = 'SELECT * FROM account WHERE email = ?';
    db.get(emailCheckQuery, [formData.email], function (err, row) {
        if (err) {
            console.error(err.message);
            return res.status(500).send('Internal Server Error');
        }


        if (row) {
            return res.status(409).send('Conflict: Email already exists'); 
        }

        
        const insertQuery = 'INSERT INTO account (name, email, role, password) VALUES (?, ?, ?, ?)';
        db.run(insertQuery, [formData.name, formData.email, formData.role, formData.password], function (err) {
            if (err) {
                console.error(err.message);
                return res.status(500).send('Internal Server Error');
            }

            res.redirect('/user');
        });
    });
});


server.get('/delete-user/:id', function (req, res) {
    let id = req.params.id;
    let query = 'DELETE FROM account WHERE id = ?';

    db.run(query, [id], function (err) {
        if (!err) {
            res.redirect('/user');
        } else {
            console.error(err.message);
            res.status(500).send('Internal Server Error');
        }
    });
});

/*---------API-------------*/


server.get('/api/category', function (req, res) {
   /* db.all('SELECT id, name, status, image_path FROM category', (err, rows)  {
        if (err) {
            console.error(err.message);
            res.status(500).send('Internal Server Error');
        } else {
            res.render('category', { categories: rows });
        }
    });*/
     db.all('SELECT id, name, price, image_path FROM category', (err, data) => {
      res.send({
        result:data
      })
    }); 
});

server.get('/api/customer', function (req, res) {
    db.all('SELECT id, name, price, image_path FROM category', (err, data) =>{
       
            res.send({
                result:data
            })
        
    });
});
server.get('/api/artist', function (req, res) {
    db.all('SELECT id, name, price, image_path FROM category', (err, data) =>{
       
            res.send({
                result:data
            })
        
    });
});
server.delete('/delete-user/:id', function (req, res) {
    let id = req.params.id;
    let query = 'DELETE FROM account WHERE id = ?';

    db.run(query, [id], function (err,data) {
        if (!err) {
            res.send({
                result:data,
                message:"Delete user successfully"
            })
        } else {
            console.error(err.message);
            res.status(500).send('Internal Server Error');
        }
    });
});


server.delete('/delete-category/:id', function (req, res) {
    let id = req.params.id;
    let query = 'DELETE FROM category WHERE id= ?';

    db.run(query, [id], function (err,data) {
        if (!err) {
            res.send({
                result:data,
                message:"Delete category successfully"
            })
        } else {
            console.error(err.message);
            res.status(500).send('Internal Server Error');
        }
    });
});


server.post('/api/create-category', upload.single('categoryImage'), function (req, res) {
    const formData = req.body;
    const categoryImage = req.file; 

    // Validate form data and file upload
    if (!formData.name || !formData.price || !categoryImage) {
        return res.status(400).send('Bad Request: Missing required data');
    }

    // Insert into the category table, including the image path
    const insertQuery = 'INSERT INTO category (name, price, image_path) VALUES (?, ?, ?)';
    db.run(insertQuery, [formData.name, formData.price, '/uploads/' + categoryImage.filename], function (err, data) {
        if (err) {
            console.error(err.message);
            return res.status(500).send('Internal Server Error');
        }

        res.send({
            result: {
                name: formData.name,
                price: formData.price,
                imageFileName: categoryImage.filename
            },
            message: 'Create category successfully'
        });
    });
});



server.get('/api/customer', function (req, res) {
    db.all('SELECT id, name, price, image_path FROM category', (err, data) =>{
       
            res.send({
                result:data
            })
        
    });
});

server.get('/api/user', function (req, res) {
    db.all('SELECT id, name, email, role  FROM account', (err, data) => {
        if (err) {
            console.error(err.message);
            res.status(500).send('Internal Server Error');
        } else {
            res.send({
                result:data
            })
        }
    });
});
server.post('/api/add-user', function (req, res) {
    const formData = req.body;

   //console.log(formData);
    if (!formData.name || !formData.email || !formData.role || !formData.password) {
        return res.status(400).send('Bad Request: Missing required data');
    }

    const emailCheckQuery = 'SELECT * FROM account WHERE email = ?';
    db.get(emailCheckQuery, [formData.email], function (err, row) {
        if (err) {
            console.error(err.message);
            return res.status(500).send('Internal Server Error');
        }

        if (row) {
            return res.status(409).send('Conflict: Email already exists');
        }

        const insertQuery = 'INSERT INTO account (name, email, role, password) VALUES (?, ?, ?, ?)';
        db.run(insertQuery, [formData.name, formData.email, formData.role, formData.password], function (err,data) {
           
            if (err) {
                console.error(err.message);
                return res.status(500).send('Internal Server Error');
            }

            res.send({
                result:formData,
                message:"Add user successfully"});
        });
    });
});



server.get('/api/edit-category/:id', function (req, res) {
    let id = req.params.id;
    let query = 'SELECT * FROM category WHERE id=?';

    db.get(query, [id], function (err, category) {
        if (!err) {
            res.send({
                result: category
            });
        } else {
            console.error(err.message);
            res.status(500).send('Internal Server Error');
        }
    });
});


server.put('/api/edit-category/:id', function (req, res) {
    let id = req.params.id;
    
    let formData = req.body;
    let query = 'UPDATE category SET name=?, price=? WHERE id=?';

    db.run(query, [formData.name, formData.price, id], function (err,data) {
        if (!err) {
            res.send({
                result:data,
                message:"Update successfully"
            })
        } else {
            console.error(err.message);
            res.status(500).send('Internal Server Error');
        }
    });
});









// Handle adding a category to the cart
server.post('/add-to-cart/:id', function (req, res) {
    const categoryId = req.params.id;
    const cart = session.getItem('cart') || [];
    
    // Check if the category is already in the cart
    const isInCart = cart.some(item => item.id === categoryId);
    
    if (!isInCart) {
        // If the category is not in the cart, add it
        cart.push({ id: categoryId });
        session.setItem('cart', cart);
        res.redirect('/customer');
    } else {
        // If the category is already in the cart, redirect back to the customer page
        res.redirect('/customer');
    }
});

// Display the user's cart
server.get('/cart', function (req, res) {
    
    const cart = session.getItem('cart') || [];
    res.render('cart', { cart: cart });
});

// Add a new route to handle adding a category to the cart
server.get('/add-to-cart/:id', function (req, res) {
    const categoryId = req.params.id;
    const cart = session.getItem('cart') || [];

    // Check if the category is already in the cart
    const isInCart = cart.some(item => item.id === categoryId);

    if (!isInCart) {
        // If the category is not in the cart, add it
        cart.push({ id: categoryId });
        session.setItem('cart', cart);
        res.redirect('/customer');
    } else {
        // If the category is already in the cart, redirect back to the customer page
        res.redirect('/customer');
    }
});





// Add a new route to handle removing a category from the cart
server.get('/remove-from-cart/:id', function (req, res) {
    const categoryId = req.params.id;
    const cart = session.getItem('cart') || [];

    // Filter out the category to be removed from the cart
    const updatedCart = cart.filter(item => item.id !== categoryId);

    // Update the cart in the session storage
    session.setItem('cart', updatedCart);

    res.redirect('/cart');
});




/// Add a new route to handle buying a category from the cart
server.get('/buy/:id', function (req, res) {
    const categoryId = req.params.id;
    const cart = session.getItem('cart') || [];

    db.run('DELETE FROM category WHERE id = ?', [categoryId], function (err) {
        if (err) {
            console.error(err.message);
            return res.status(500).send('Internal Server Error');
        }

    });

   
    // Filter out the category to be bought from the cart
    const updatedCart = cart.filter(item => item.id !== categoryId);

    // Update the cart in the session storage
    session.setItem('cart', updatedCart);

    res.redirect('/cart');
});







server.get('/category/:id', (req, res) => {
    const categoryId = req.params.id;

    db.get('SELECT id, name, price, image_path FROM category WHERE id = ?', [categoryId], (err, category) => {
        if (err) {
            console.error(err.message);
            res.status(500).send('Internal Server Error');
        } else {
            if (category) {
                res.render('category-detail', { category });
            } else {
                res.status(404).send('Category not found');
            }
        }
    });
});


server.get('/customer/category/:id', (req, res) => {
    const categoryId = req.params.id;

    db.get('SELECT id, name, price, image_path FROM category WHERE id = ?', [categoryId], (err, category) => {
        if (err) {
            console.error(err.message);
            res.status(500).send('Internal Server Error');
        } else {
            if (category) {
                res.render('cus-category-detail', { category });
            } else {
                res.status(404).send('Category not found');
            }
        }
    });
});












server.listen(process.env.PORT||8000);
