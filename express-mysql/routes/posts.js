var express = require('express');
var router = express.Router();
var multer = require('multer');
var path = require('path');

// Import database
var connection = require('../library/database');

// Set storage engine
var storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, './public/uploads/');
    },
    filename: function(req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});

// Init upload
var upload = multer({
    storage: storage,
    limits: { fileSize: 1000000 }, 
    fileFilter: function(req, file, cb) {
        checkFileType(file, cb);
    }
}).single('gambar_produk');

function checkFileType(file, cb) {
    var filetypes = /jpeg|jpg|png|gif/;
    var extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    var mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb('Error: Images Only!');
    }
}

// INDEX POSTS
router.get('/', function (req, res, next) {
    connection.query('SELECT * FROM posts ORDER BY id DESC', function (err, rows) {
        if (err) {
            req.flash('error', err);
            res.render('posts/index', { data: ''});
        } else {
            res.render('posts/index', { data: rows });
        }
    });
});

// CREATE POST
router.get('/create', function (req, res, next) {
    res.render('posts/create', {
        gambar_produk: '',
        nama_produk: '',
        deskripsi: '',
        kategori: '',
        harga_produk: '',
        status: ''
    });
});

// STORE POST
router.post('/store', function (req, res, next) {
    upload(req, res, function (err) {
        console.log('Multer Error:', err);
        console.log('File:', req.file);
        console.log('Body:', req.body);

        if (err) {
            req.flash('error', 'Error uploading file.');
            console.error('Upload Error:', err);
            return res.redirect('/posts/create');
        }

        if (!req.file) {
            req.flash('error', 'Silakan masukkan gambar produk');
            console.error('File not found in request');
            return res.redirect('/posts/create');
        }

        var gambar_produk = req.file.filename; // Corrected variable name
        var { nama_produk, deskripsi, kategori, harga_produk, status } = req.body;

        if(!nama_produk || !deskripsi || !kategori || !harga_produk || !status || !gambar_produk) {
            req.flash('error', 'Silakan lengkapi semua kolom');
            console.error('Validation Error:', { nama_produk, deskripsi, kategori, harga_produk, status, gambar_produk });
            return res.redirect('/posts/create');
        }

        var formData = { gambar_produk, nama_produk, deskripsi, kategori, harga_produk, status };
        connection.query('INSERT INTO posts SET ?', formData, function(err, result) {
            if (err) {
                req.flash('error', 'Gagal menyimpan data. Silakan coba lagi.');
                console.error('Database Error:', err);
                return res.redirect('/posts/create');
            } else {
                req.flash('success', 'Data berhasil disimpan!');
                return res.redirect('/posts');
            }
        });
    });
});

// EDIT POST
router.get('/edit/(:id)', function(req, res, next) {
    let id = req.params.id;

    connection.query('SELECT * FROM posts WHERE id = ?', [id], function(err, rows, fields) {
        if(err) throw err;

        if (rows.length <= 0) {
            req.flash('error', 'Data Post Dengan ID ' + id + ' Tidak Ditemukan');
            return res.redirect('/posts');
        } else {
            res.render('posts/edit', {
                id: rows[0].id,
                gambar_produk: rows[0].gambar_produk,
                nama_produk: rows[0].nama_produk,
                deskripsi: rows[0].deskripsi,
                kategori: rows[0].kategori,
                harga_produk: rows[0].harga_produk,
                status: rows[0].status,
            });
        }
    });
});

// UPDATE POST
router.post('/update/:id', function (req, res, next) {
    upload(req, res, function(err) {
        if (err) {
            req.flash('error', 'Error uploading file.');
            console.error('Upload Error:', err);
            return res.redirect('/posts/edit/' + req.params.id);
        }

        let id = req.params.id;
        let nama_produk = req.body.nama_produk;
        let deskripsi = req.body.deskripsi;
        let kategori = req.body.kategori;
        let harga_produk = req.body.harga_produk;
        let status = req.body.status;
        let old_gambar_produk = req.body.old_gambar_produk;
        let gambar_produk = req.file ? req.file.filename : old_gambar_produk;
        let errors = false;

        console.log('Nama Produk:', nama_produk);
        console.log('Deskripsi:', deskripsi);
        console.log('Kategori:', kategori);
        console.log('Harga_Produk:', harga_produk);
        console.log('Status:', status);
        console.log('Old Gambar Produk:', old_gambar_produk);
        console.log('Gambar Produk:', gambar_produk);

        if (!nama_produk) {
            errors = true;
            req.flash('error', "Silahkan Masukkan Nama Produk");
        }

        if (!deskripsi) {
            errors = true;
            req.flash('error', "Silahkan Masukkan Deskripsi Produk");
        }

        if (!kategori) {
            errors = true;
            req.flash('error', "Silahkan Masukkan Kategori Produk");
        }

        if (!harga_produk) {
            errors = true;
            req.flash('error', "Silahkan Masukkan Harga Produk");
        }

        if (!status) {
            errors = true;
            req.flash('error', "Silahkan Masukkan Status");
        }

        if (errors) {
            return res.render('posts/edit', {
                id: id,
                nama_produk: nama_produk,
                deskripsi: deskripsi,
                kategori: kategori,
                harga_produk: harga_produk,
                status: status,
                gambar_produk: old_gambar_produk
            });
        }

        let formData = {
            gambar_produk: gambar_produk,
            nama_produk: nama_produk,
            deskripsi: deskripsi,
            kategori: kategori,
            harga_produk: harga_produk,
            status: status
        };

        connection.query('UPDATE posts SET ? WHERE id = ?', [formData, id], function(err, result) {
            if (err) {
                req.flash('error', err);
                return res.render('posts/edit', {
                    id: id,
                    nama_produk: nama_produk,
                    deskripsi: deskripsi,
                    kategori: kategori,
                    harga_produk: harga_produk,
                    status: status,
                    gambar_produk: old_gambar_produk 
                });
            } else {
                req.flash('success', 'Data Berhasil Diupdate!');
                return res.redirect('/posts');
            }
        });
    });
});

// DELETE POST
router.get('/delete/(:id)', function(req, res, next) {
    let id = req.params.id;

    connection.query('DELETE FROM posts WHERE id = ?', [id], function(err, result) {
        if (err) {
            req.flash('error', 'Gagal menghapus data. Silakan coba lagi.');
            return res.redirect('/posts');
        } else {
            req.flash('success', 'Data Berhasil Dihapus!');
            return res.redirect('/posts');
        }
    });
});

module.exports = router;
