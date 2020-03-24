const axios = require('axios');

const encodeForm = (data) => {
    return Object.keys(data)
        .map(key => encodeURIComponent(key) + '=' + encodeURIComponent(data[key]))
        .join('&');
}


async function getAccessToken(api_key) {
    try {
        let formData = {
            grant_type: "urn:ibm:params:oauth:grant-type:apikey",
            apikey: api_key,
        }
        const headers = {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json',
            'Access-Control-Allow-Origin': '*',
        }
        let res = await axios.post('https://iam.cloud.ibm.com/identity/token', encodeForm(formData), {
            headers: headers
        });

        return res.data['access_token']
    } catch (e) {
        //console.log(e)
        return undefined;
    }
}

function isWindowsVSI(vsi_object) {

    if ("image" in vsi_object) {
        return vsi_object['image']['name'].includes('windows-server');
    } else {
        //console("Image does not exist");
        return undefined;
    }

}

async function getAllInstances(access_token) {
    const headers = {
        'Authorization': access_token,
        'Access-Control-Allow-Origin': '*',
    }
    var returnArray = []
    try {
        let res = await axios.get('https://us-south.iaas.cloud.ibm.com/v1/instances?version=2020-03-10&generation=2',
            { headers: headers });

        if ('instances' in res.data) {
            let instance_list = res.data['instances'];
            instance_list.forEach(element => {
                if (isWindowsVSI(element)) {
                    returnArray.push({
                        'id': element['id'],
                        'name': element['name']
                    })
                }
            });

        } else {
            //console.log("No Instances");
        }

        return returnArray;
    } catch (e) {
        //console.log(e);
        var empty_array = [];
        return empty_array;
    }
}

async function getInstanceEncryptedPassword(access_token, id) {
    const headers = {
        'Authorization': access_token,
        'Access-Control-Allow-Origin': '*',
    }

    try {
        let url_string = 'https://us-south.iaas.cloud.ibm.com/v1/instances/' + id + '/initialization?version=2020-03-10&generation=2';
        let res = await axios.get(url_string, { headers: headers });
        if ("password" in res.data) {
            if ("encrypted_password" in res.data['password']) {
                return res.data['password']['encrypted_password'];
            }
        }
        return undefined;
    } catch (e) {
        return undefined;
    }
}

async function asyncForEach(array, callback) {
    for (let index = 0; index < array.length; index++) {
        await callback(array[index], index, array);
    }
}

export async function getAllEncryptedPasswords(api_key) {
    const access_token = await getAccessToken(api_key);

    if (!access_token) {
        return undefined;
    }

    const windows_instance_list = await getAllInstances(access_token);

    await asyncForEach(windows_instance_list, async element => {
        var encrypted_password = await getInstanceEncryptedPassword(access_token, element['id']);
        element['encrypted_password'] = encrypted_password;
    });
    return windows_instance_list;

}
