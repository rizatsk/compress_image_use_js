if (!$('#file')[0].files[0]) {
            $('#btn-uploadImage').prop('disabled', true);
        } 
        
        $('#file').on("change", function() {
            if (!$('#file')[0].files[0]) {
                $('#btn-uploadImage').prop('disabled', true);
            };

            $('#btn-uploadImage').prop('disabled', false);
        });

        $('#uploadImage').submit(async function (e) {
            e.preventDefault();
            let file = await process_image($('#file')[0].files[0]);
            file = dataURLtoFile(file, `${new Date().getTime()}.webp`);
            // const file = $('#file')[0].files[0];
            const form = new FormData();
            form.append("userId", "{{session('user_id')}}");
            form.append("image", file);

            $.ajax({
                url: "http://172.104.164.57/api/mobile/users/profile-picture",
                method: "PUT",
                timeout: 0,
                processData: false,
                mimeType: "multipart/form-data",
                contentType: false,
                data: form,
                success : function(response) {
                    const imageLink = JSON.parse(response).data.imageLink;
                    let data = imageLink.split('mobile');
                    $.ajax({
                        headers: {'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content')},
                        method: 'POST',
                        url: `{{url('set_session')}}`,
                        data: {image: data[1]},
                        success: function() {
                            location.reload();
                        }
                    })
                }
            });
        });

        // function base64 to file
        function dataURLtoFile(dataurl, filename) {
            var arr = dataurl.split(','),
                mime = arr[0].match(/:(.*?);/)[1],
                bstr = atob(arr[1]), 
                n = bstr.length, 
                u8arr = new Uint8Array(n);
                
            while(n--){
                u8arr[n] = bstr.charCodeAt(n);
            }
            
            return new File([u8arr], filename, {type:mime});
        }

        //Usage example:
        var file = dataURLtoFile('data:text/plain;base64,aGVsbG8gd29ybGQ=','hello.txt');
        console.log(file);

        // compress image
                /**
         * Resize a base 64 Image
         * @param {String} base64Str - The base64 string (must include MIME type)
         * @param {Number} MAX_WIDTH - The width of the image in pixels
         * @param {Number} MAX_HEIGHT - The height of the image in pixels
         */
        async function reduce_image_file_size(base64Str, MAX_WIDTH = 450, MAX_HEIGHT = 450) {
            let resized_base64 = await new Promise((resolve) => {
                let img = new Image()
                img.src = base64Str
                img.onload = () => {
                    let canvas = document.createElement('canvas')
                    let width = img.width
                    let height = img.height

                    if (width > height) {
                        if (width > MAX_WIDTH) {
                            height *= MAX_WIDTH / width
                            width = MAX_WIDTH
                        }
                    } else {
                        if (height > MAX_HEIGHT) {
                            width *= MAX_HEIGHT / height
                            height = MAX_HEIGHT
                        }
                    }
                    canvas.width = width
                    canvas.height = height
                    let ctx = canvas.getContext('2d')
                    ctx.drawImage(img, 0, 0, width, height)
                    resolve(canvas.toDataURL()) // this will return base64 image results after resize
                }
            });
            return resized_base64;
        }


        async function image_to_base64(file) {
            let result_base64 = await new Promise((resolve) => {
                let fileReader = new FileReader();
                fileReader.onload = (e) => resolve(fileReader.result);
                fileReader.onerror = (error) => {
                    console.log(error)
                    alert('An Error occurred please try again, File might be corrupt');
                };
                fileReader.readAsDataURL(file);
            });
            return result_base64;
        }

        async function process_image(file, min_image_size = 300) {
            const res = await image_to_base64(file);
            if (res) {
                const old_size = calc_image_size(res);
                if (old_size > min_image_size) {
                    const resized = await reduce_image_file_size(res);
                    const new_size = calc_image_size(resized)
                    console.log('new_size=> ', new_size, 'KB');
                    console.log('old_size=> ', old_size, 'KB');
                    return resized;
                } else {
                    console.log('image already small enough')
                    return res;
                }

            } else {
                console.log('return err')
                return null;
            }
        }

        // /*- NOTE: USE THIS JUST TO GET PROCESSED RESULTS -*/
        // async function preview_image() {
        //     const file = document.getElementById('file');
        //     const image = await process_image(file.files[0]);
        // }

        function calc_image_size(image) {
            let y = 1;
            if (image.endsWith('==')) {
                y = 2
            }
            const x_size = (image.length * (3 / 4)) - y
            return Math.round(x_size / 1024)
        }
    });
