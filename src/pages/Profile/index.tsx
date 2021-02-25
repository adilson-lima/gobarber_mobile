import React, { useCallback, useRef } from 'react'
import { View, ScrollView, KeyboardAvoidingView, Platform, TextInput, Alert } from 'react-native'
import ImagePicker from 'react-native-image-picker'
import Icon from 'react-native-vector-icons/Feather'
import { useNavigation } from '@react-navigation/native'
import { Form } from '@unform/mobile'
import { FormHandles } from '@unform/core'
import * as Yup from 'yup'



import getValidationErrors from '../../util/getValidationErrors'
import api from '../../services/api'

import Input from '../../components/Input'
import Button from '../../components/Button'
import { useAuth } from '../../hooks/auth'
import {
    Container,
    Title,
    UserAvatarButton,
    UserAvatar,
    BackButton,
} from './styles'

interface ProfileFormData {
    name: string;
    email: string;
    old_password: string;
    password: string;
    password_confirmation: string;
}



const Profile: React.FC = () => {

    const formRef = useRef<FormHandles>(null)

    const emailInputRef = useRef<TextInput>(null)

    const oldPasswordInputRef = useRef<TextInput>(null)
    const passwordInputRef = useRef<TextInput>(null)
    const confirmPasswordInputRef = useRef<TextInput>(null)

    const { user, updateUser } = useAuth()

    const navigation = useNavigation()



    const handleSignUp = useCallback(async (data: ProfileFormData) => {
        try {

            formRef.current?.setErrors({})


            const schema = Yup.object().shape({
                name: Yup.string().required('Nome obrigatório'),
                email: Yup.string().required('E-mail obrigatório').email('Digite um e-mail válido'),
                old_password: Yup.string(),
                password: Yup.string().when('old_password', {
                    is: val => !!val.length,
                    then: Yup.string().required('Campo obrigatório'),
                    otherwise: Yup.string(),
                }),
                password_confirmation: Yup.string()
                .when('old_password', {
                    is: val => !!val.length,
                    then: Yup.string().required('Campo obrigatório'),
                    otherwise: Yup.string(),
                })
                .oneOf(
                    [Yup.ref('password'), undefined],
                    'Confirmação incorreta',
                )
            })


            await schema.validate(data, {
                abortEarly: false
            })


            const { name, email, old_password, password, password_confirmation } = data;

            const formData = Object.assign({
                name,
                email,
            }, old_password ? {
                old_password,
                password,
                password_confirmation
            } : {})




            const response = await api.put('/profile', formData)
            updateUser(response.data)

            Alert.alert('Perfil atualizado com sucesso!')

            navigation.goBack()
        }
        catch (err) {
            if (err instanceof Yup.ValidationError) {
                const errors = getValidationErrors(err)
                formRef.current?.setErrors(errors)

                return;
            }
            Alert.alert(
                'Erro na atualização do perfil',
                'Ocorreu um error ao atualizar seu perfil, tente novamente.'
            )
        }
    }, [navigation, updateUser])


    const handleUpdateAvatar = useCallback(()=>{


        ImagePicker.showImagePicker({
            title: 'Selecione um avatar',
            cancelButtonTitle: 'Cancelar',
            takePhotoButtonTitle: 'Usar câmera',
            chooseFromLibraryButtonTitle: 'Escolhe da galeria'
        }, response=>{
            if(response.didCancel){
                return;
            }
            if(response.error){
                Alert.alert('Erro ao atualizar seu avatar')
                return;
            }

            // const source = { uri: response.uri };

            const data = new FormData()
            data.append('avatar', {
                type: 'image/jpg',
                name: `${user.id}.jpg`,
                uri: response.uri
            })

            api.patch('users/avatar', data).then(apiResponse => {
                updateUser(apiResponse.data);
            })
        })

    }, [updateUser, user.id])

    const handleGoBack = useCallback(()=>{
        navigation.goBack();
    }, [navigation])


    return (

        <>
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                enabled
            >

                <ScrollView
                    keyboardShouldPersistTaps="handled"
                    contentContainerStyle={{ flex: 1 }}
                >
                    <Container>
                        <BackButton onPress={handleGoBack}>
                            <Icon name="chevron-left" size={24} color="#999591" />
                        </BackButton>

                        <UserAvatarButton onPress={handleUpdateAvatar}>
                            <UserAvatar source={{ uri: user.avatar_url}} />
                        </UserAvatarButton>
                        <View>
                            <Title>Meu perfil</Title>
                        </View>

                        <Form initialData={user} ref={formRef} onSubmit={handleSignUp}>
                            <Input
                                name="name"
                                icon="user"
                                placeholder="Nome"
                                autoCapitalize="words"
                                returnKeyType="next"
                                onSubmitEditing={() => {
                                    emailInputRef.current?.focus()
                                }}
                            />
                            <Input
                                ref={emailInputRef}
                                name="email"
                                icon="mail"
                                placeholder="E-mail"
                                keyboardType="email-address"
                                autoCorrect={false}
                                autoCapitalize="none"
                                returnKeyType="next"
                                onSubmitEditing={() => {
                                    oldPasswordInputRef.current?.focus()
                                }}
                            />
                            <Input
                                ref={oldPasswordInputRef}
                                name="old_password"
                                icon="lock"
                                placeholder="Senha atual"
                                secureTextEntry
                                textContentType="newPassword"
                                returnKeyType='next'
                                containerStyle={{marginTop: 16}}
                                onSubmitEditing={() => {
                                    passwordInputRef.current?.focus()
                                }}
                            />

<Input
                                ref={passwordInputRef}
                                name="password"
                                icon="lock"
                                placeholder="Nova senha"
                                secureTextEntry
                                textContentType="newPassword"
                                returnKeyType='next'
                                onSubmitEditing={() => {
                                    confirmPasswordInputRef.current?.focus()
                                }}
                            />

<Input
                                ref={confirmPasswordInputRef}
                                name="password_confirmation"
                                icon="lock"
                                placeholder="Confirmar senha"
                                secureTextEntry
                                textContentType="newPassword"
                                returnKeyType='send'
                                onSubmitEditing={() => {
                                    formRef.current?.submitForm()
                                }}
                            />
                        </Form>


                        <Button onPress={() => {
                            formRef.current?.submitForm();
                        }}>Confirmar mudanças</Button>

                    </Container>
                </ScrollView>


            </KeyboardAvoidingView>


        </>
    )
}

export default Profile
