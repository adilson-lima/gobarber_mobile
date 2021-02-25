import { useNavigation, useRoute } from '@react-navigation/native'
import React, { useCallback, useMemo } from 'react'
import Icon from 'react-native-vector-icons/Feather'
import { format } from 'date-fns'
import ptBR from 'date-fns/locale/pt-BR'

// import { useAuth } from '../../hooks/auth'

import {
    Container,
    Title,
    Description,
    OkButton,
    OkButtonText
} from './styles'

interface RouteParams {
    date: number;
}

const AppointmentCreated: React.FC = () => {

    const { params } = useRoute();

    const routeParams = params as RouteParams;

    // const { signOut } = useAuth();
    const { reset } = useNavigation();

    const handleOkPressed = useCallback(()=>{
        reset({
            routes: [{ name: 'Dashboard' }],
            index: 0,
        })
    }, [reset])


    const formatedDate = useMemo(()=>{
        return format(
            routeParams.date,
            "EEEE', dia' dd 'de' MMMM 'de' yyyy 'às' HH:mm'h' ",
            {locale: ptBR})
    }, [routeParams.date])

    return (
        <Container>
            <Icon name='check' size={80} color="#04d361" />

            <Title>Agendamento concluído</Title>
            <Description>{formatedDate}</Description>
            <OkButton onPress={handleOkPressed}>
                <OkButtonText>Ok</OkButtonText>
            </OkButton>
        </Container>
    )
}

export default AppointmentCreated
